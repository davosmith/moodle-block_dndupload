blocks_dndupload = {
    sesskey: null,
    serverurl: null,
    loadingimg: null,
    courseid: null,
    maxsize: null,
    addimg: null,
    entercount: 0, // Nasty hack to distinguish between dragenter(first entry), dragenter+dragleave(moving between child elements) and dragleave (leaving element)
    currentsection: null,
    langstrings: null,

    get_string: function(str, mod) {
	if (str in this.langstrings) {
	    return this.langstrings[str];
	}
	return '[['+str+']]';
    },

    init_string: function(str, display) {
	if (this.langstrings == null) {
	    this.langstrings = new Array();
	}
	this.langstrings[str] = display;
    },

    init: function(sesskey, serverurl, courseid, loadingimg, maxsize, addimg) {
	if (!this.hasRequiredFunctionality()) {
	    document.getElementById('dndupload-status').innerHTML = this.get_string('nofilereader', 'block_dndupload');
	    return;
	}

	if (!this.ajaxeditenabled()) {
	    document.getElementById('dndupload-status').innerHTML = this.get_string('noajax', 'block_dndupload');
	    return;
	}

	document.getElementById('dndupload-status').innerHTML = this.get_string('dndworking', 'block_dndupload');

	this.sesskey = sesskey;
	this.serverurl = serverurl;
	this.courseid = courseid;
	this.loadingimg = loadingimg;
	this.maxsize = maxsize;
	this.addimg = addimg;

	var els = document.getElementsByTagName('tr');
	var self = this;
	for (var i=0; i<els.length; i++) {
	    if ((els[i].className.search('section') >= 0)
		&& (els[i].className.search('main') >= 0)) {
		this.addpreviewelement(els[i]);
		els[i].addEventListener('dragenter', function(e) {
		    self.dragenter(e);
		}, false);
		els[i].addEventListener('dragleave', function(e) {
		    self.dragleave(e);
		}, false);
		els[i].addEventListener('dragover', function(e) {
		    self.dragover(e);
		}, false);
		els[i].addEventListener('drop', function(e) {
		    self.drop(e);
		}, false);
	    }
	}
    },

    hasRequiredFunctionality: function() {
	if (typeof FileReader=="undefined") {
	    return false;
	}
	if (typeof FormData=="undefined") {
	    return false;
	}
	return true;
    },

    ajaxeditenabled: function() {
	if (typeof main=="undefined") {
	    return false;
	}
	return true;
    },

    getsection: function(el) {
	while (el.className.search('section') < 0
	       || el.className.search('main') < 0) {
	    el = el.parentNode;
	    if (!el) {
		return null;
	    }
	}
	return el;
    },

    draghasfiles: function(e) {
	for (var i=0; i<e.dataTransfer.types.length; i++) {
	    if (e.dataTransfer.types[i] == 'Files') {
		return true;
	    }
	}

	return false;
    },

    dragenter: function(e) {
	e.stopPropagation();
	e.preventDefault();

	var section = this.getsection(e.currentTarget);

	if (this.currentsection && this.currentsection != section) {
	    this.currentsection = section;
	    this.entercount = 1;
	} else {
	    this.entercount++;
	    if (this.entercount > 2) {
		this.entercount = 2;
		return;
	    }
	}

	if (this.draghasfiles(e)) {
	    this.showpreviewelement(section);
	}
	return false;
    },

    dragleave: function(e) {
	e.stopPropagation();
	e.preventDefault();

	this.entercount--;
	if (this.entercount == 1) {
	    return;
	}
	this.entercount = 0;
	this.currentsection = null;

	this.hidepreviewelement();
	return false;
    },

    dragover: function(e) {
	e.stopPropagation();
	e.preventDefault();
	return false;
    },

    drop: function(e) {
	e.stopPropagation();
	e.preventDefault();

	this.hidepreviewelement();

	if (!this.draghasfiles(e)) {
	    return false;
	}

	var section = e.currentTarget;
	var sectionid = section.id.split('-');
	if (sectionid.length < 2 || sectionid[0] != 'section') {
	    return false;
	}
	var sectionnumber = parseInt(sectionid[1]);

	var files = e.dataTransfer.files;
	for (var i=0, f; f=files[i]; i++) {
	    this.uploadfile(f, section, sectionnumber);
	}

	return false;
    },

    getmodselement: function(section) {
	var uls = section.getElementsByTagName('ul');

	// Find the 'ul' containing the list of mods
	var modsel = null;
	for (var i=0; i<uls.length; i++) {
	    if (uls[i].className.search('section') >= 0) {
		modsel = uls[i];
		break;
	    }
	}
	// Create the above 'ul' if it doesn't exist
	if (!modsel) {
	    var modsel = document.createElement('ul');
	    modsel.className = 'section img-text';
	    var contentel = sectionel.lastChild;
	    var brel = contentel.lastChild;
	    contentel.insertBefore(modsel, brel);
	}

	return modsel;
    },

    addresourceelement: function(file, section) {
	var modsel = this.getmodselement(section);

	var resel = {
	    parent: modsel,
	    li: document.createElement('li'),
	    a: document.createElement('a'),
	    icon: document.createElement('img'),
	    namespan: document.createElement('span'),
	    progressouter: document.createElement('span'),
	    progress: document.createElement('span')
	};

	resel.li.className = 'activity resource modtype_resource';

	resel.a.href = '#';
	resel.li.appendChild(resel.a);

	resel.icon.src = this.loadingimg;
	resel.icon.height = 16;
	resel.icon.width = 16;
	resel.a.appendChild(resel.icon);

	resel.a.appendChild(document.createTextNode(' '));

	resel.namespan.className = 'instancename';
	resel.namespan.innerHTML = file.name;
	resel.a.appendChild(resel.namespan);

	resel.li.appendChild(document.createTextNode(' '));

	resel.progressouter.className = 'dndupload-progress-outer';
	resel.progress.className = 'dndupload-progress-inner';
	resel.progress.innerHTML = '&nbsp;';
	resel.progressouter.appendChild(resel.progress);
	resel.li.appendChild(resel.progressouter);

	modsel.insertBefore(resel.li, modsel.lastChild); // Leave the 'preview element' at the bottom

	return resel;
    },

    hidepreviewelement: function() {
	var lis = document.getElementsByTagName('li');
	for (var i=0; i<lis.length; i++) {
	    if (lis[i].className.search('dndupload-preview') >= 0) {
		if (lis[i].className.search('dndupload-hidden') < 0) {
		    lis[i].className += ' dndupload-hidden';
		}
	    }
	}
    },

    showpreviewelement: function(section) {
	this.hidepreviewelement();
	var lis = section.getElementsByTagName('li');
	for (var i=0; i<lis.length; i++) {
	    if (lis[i].className.search('dndupload-preview') >= 0) {
		lis[i].className = lis[i].className.replace(' dndupload-hidden', '');
		return;
	    }
	}
    },

    addpreviewelement: function(section) {
	var modsel = this.getmodselement(section);
	var preview = {
	    li: document.createElement('li'),
	    div: document.createElement('div'),
	    icon: document.createElement('img'),
	    namespan: document.createElement('span')
	};

	preview.li.className = 'dndupload-preview activity resource modtype_resource dndupload-hidden';

	preview.div.className = 'mod-indent';
	preview.li.appendChild(preview.div);

	preview.icon.src = this.addimg;
	preview.icon.height = 16;
	preview.icon.width = 16;
	preview.div.appendChild(preview.icon);

	preview.div.appendChild(document.createTextNode(' '));

	preview.namespan.className = 'instancename';
	preview.namespan.innerHTML = this.get_string('addhere', 'block_dndupload');
	preview.div.appendChild(preview.namespan);

	modsel.appendChild(preview.li);
    },

    uploadfile: function(file, section, sectionnumber) {
	var xhr = new XMLHttpRequest();
	var self = this;

        if (file.name == '.ds_store') {
            return; // Ignore these hidden Mac OS files
        }

	if (file.size > this.maxsize) {
	    alert("'"+file.name+"' "+this.get_string('filetoolarge', 'block_dndupload'));
	    return;
	}

	// Add the file to the display
	var resel = this.addresourceelement(file, section);

	// Wait for the file to finish sending to the server
	xhr.addEventListener('load', function(e) {
	    //debugmsg.innerHTML += 'File '+file.name+' sent';
	}, false);

	xhr.upload.addEventListener('progress', function(e) {
	    if (e.lengthComputable) {
		var percentage = Math.round((e.loaded * 100) / e.total);
		resel.progress.style.width = percentage + '%';
	    }
	}, false);

	xhr.onreadystatechange = function() {
	    if (xhr.readyState == 4) {
		if (xhr.status == 200) {
		    var result = JSON.parse(xhr.responseText);
		    if (result) {
			if (result.error == 0) {
			    resel.icon.src = result.icon;
			    resel.a.href = result.link;
			    resel.namespan.innerHTML = result.filename;
			    resel.li.removeChild(resel.progressouter);
			    resel.li.id = result.elementid;
			    resel.li.innerHTML += result.commands;
			    self.addediting(result.elementid, sectionnumber);
			} else {
			    resel.parent.removeChild(resel.li);
			    alert(result.error+': '+result.errormessage);
			}
		    }
		}
	    }
	};

	var formData = new FormData();
	formData.append('uploadfile[]', file);
	formData.append('sesskey', this.sesskey);
	formData.append('course', this.courseid);
	formData.append('section', sectionnumber);

	xhr.open("POST", this.serverurl+"/upload.php", true);
	xhr.send(formData);
    },

    addediting: function(elementid, sectionnumber) {
	var section = main.sections[sectionnumber];
	if (!section) {
	    return;
	}

	section.resources[section.resources.length] = new resource_class(elementid, 'resources', null, section);
    }

};