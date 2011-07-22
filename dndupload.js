M.blocks_dndupload = {
    sesskey: null,
    serverurl: null,
    loadingimg: null,
    courseid: null,
    maxsize: null,
    addimg: null,
    entercount: 0, // Nasty hack to distinguish between dragenter(first entry), dragenter+dragleave(moving between child elements) and dragleave (leaving element)
    currentsection: null,

    init: function(Y, sesskey, serverurl, courseid, loadingimg, maxsize, addimg) {
	if (!this.hasRequiredFunctionality()) {
	    document.getElementById('dndupload-status').innerHTML = M.util.get_string('nofilereader', 'block_dndupload');
	    return;
	}

	document.getElementById('dndupload-status').innerHTML = M.util.get_string('dndworking', 'block_dndupload');

	this.sesskey = sesskey;
	this.serverurl = serverurl;
	this.courseid = courseid;
	this.loadingimg = loadingimg;
	this.maxsize = maxsize;
	this.addimg = addimg;

	var els = document.getElementsByTagName('li');
	var self = this;
	for (var i=0; i<els.length; i++) {
	    if ((els[i].className.search('section') >= 0)
		&& (els[i].className.search('main') >= 0)) {
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
	if (!window.FileReader) {
	    return false;
	}
	if (!window.FormData) {
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

	if (this.currentsection && this.currentsection != e.currentTarget) {
	    this.currentsection = e.currentTarget;
	    this.entercount = 1;
	} else {
	    this.entercount++;
	    if (this.entercount > 2) {
		this.entercount = 2;
		return;
	    }
	}

	if (this.draghasfiles(e)) {
	    var section = e.currentTarget;
	    this.addpreviewelement(section);
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

	this.removepreviewelement();
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

	this.removepreviewelement();

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
	    div: document.createElement('div'),
	    a: document.createElement('a'),
	    icon: document.createElement('img'),
	    namespan: document.createElement('span'),
	    progressouter: document.createElement('span'),
	    progress: document.createElement('span')
	};

	resel.li.className = 'activity resource modtype_resource';

	resel.div.className = 'mod-indent';
	resel.li.appendChild(resel.div);

	resel.a.href = '#';
	resel.div.appendChild(resel.a);

	resel.icon.src = this.loadingimg;
	resel.icon.height = 16;
	resel.icon.width = 16;
	resel.a.appendChild(resel.icon);

	resel.a.appendChild(document.createTextNode(' '));

	resel.namespan.className = 'instancename';
	resel.namespan.innerHTML = file.name;
	resel.a.appendChild(resel.namespan);

	resel.div.appendChild(document.createTextNode(' '));

	resel.progressouter.className = 'dndupload-progress-outer';
	resel.progress.className = 'dndupload-progress-inner';
	resel.progress.innerHTML = '&nbsp;';
	resel.progressouter.appendChild(resel.progress);
	resel.div.appendChild(resel.progressouter);

	modsel.appendChild(resel.li);

	return resel;
    },

    removepreviewelement: function() {
	var el = document.getElementById('dndupload-preview');
	if (el) {
	    var parent = el.parentNode;
	    if (parent) {
		parent.removeChild(el);
	    }
	}
    },

    addpreviewelement: function(section) {
	this.removepreviewelement();

	var modsel = this.getmodselement(section);
	var preview = {
	    li: document.createElement('li'),
	    div: document.createElement('div'),
	    icon: document.createElement('img'),
	    namespan: document.createElement('span')
	};

	preview.li.className = 'dndupload-preview activity resource modtype_resource';
	preview.li.id = 'dndupload-preview';

	preview.div.className = 'mod-indent';
	preview.li.appendChild(preview.div);

	preview.icon.src = this.addimg;
	preview.icon.height = 16;
	preview.icon.width = 16;
	preview.div.appendChild(preview.icon);

	preview.div.appendChild(document.createTextNode(' '));

	preview.namespan.className = 'instancename';
	preview.namespan.innerHTML = M.util.get_string('addhere', 'block_dndupload');
	preview.div.appendChild(preview.namespan);

	modsel.appendChild(preview.li);
    },

    addpostfield: function(boundary, name, value, filename, filetype) {
	var rtn;
	rtn = '--'+boundary+'\n';
	rtn += 'Content-Disposition: form-data; name="'+name+'"';
	if (filename !== undefined) {
	    rtn += '; filename="'+filename+'"\n';
	    rtn += 'Content-Type: '+filetype+'"\n';
	    rtn += 'Content-Transfer-Encoding: base64';
	}
	rtn += '\n\n';
	rtn += value+'\n';

	return rtn;
    },

    uploadfile: function(file, section, sectionnumber) {
	var xhr = new XMLHttpRequest();
	var self = this;

	if (file.size > this.maxsize) {
	    alert("'"+file.name+"' "+M.util.get_string('filetoolarge', 'block_dndupload'));
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
			    resel.div.removeChild(resel.progressouter);
			    resel.li.id = result.elementid;
			    resel.div.innerHTML += result.commands;
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