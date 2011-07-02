M.blocks_dndupload = {
    sesskey: null,
    serverurl: null,
    loadingimg: null,
    courseid: null,
    maxsize: null,

    init: function(Y, sesskey, serverurl, courseid, loadingimg, maxsize) {
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
	return true;
    },

    getsection: function(el) {
	while (el.className.search('section') < 0
	       || el.className.search('main') < 0) {
	    el = el.parentNode;
	}
	return el;
    },

    dragenter: function(e) {
	e.stopPropagation();
	e.preventDefault();
	var section = this.getsection(e.target);
	//section = e.target;
	if (section.className.search('dndupload-dropready') < 0) {
	    section.className += ' dndupload-dropready';
	}
	return false;
    },

    dragleave: function(e) {
	e.stopPropagation();
	e.preventDefault();
	var section = this.getsection(e.target);
	//section = e.target;
	section.className = section.className.replace(' dndupload-dropready','');
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

	var section = this.getsection(e.target);
	section.className = section.className.replace(' dndupload-dropready', '');

	var sectionid = section.id.split('-');
	if (sectionid.length < 2 || sectionid[0] != 'section') {
	    return false;
	}
	var sectionnumber = parseInt(sectionid[1]);

	var files = event.dataTransfer.files;
	for (var i=0, f; f=files[i]; i++) {
	    this.uploadfile(f, sectionnumber);
	}

	return false;
    },

    addresourceelement: function(file, sectionnumber) {
	var sectionel = document.getElementById('section-'+sectionnumber);
	var uls = sectionel.getElementsByTagName('ul');

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

	var resel = {
	    parent: modsel,
	    li: document.createElement('li'),
	    div: document.createElement('div'),
	    a: document.createElement('a'),
	    icon: document.createElement('img'),
	    namespan: document.createElement('span')
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

	modsel.appendChild(resel.li);

	return resel;
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

    uploadfile: function(file, sectionnumber) {
	var xhr = new XMLHttpRequest();
	var reader = new FileReader();

	if (file.size > this.maxsize) {
	    alert("'"+file.name+"' "+M.util.get_string('filetoolarge', 'block_dndupload'));
	    return;
	}

	// Add the file to the display
	var resel = this.addresourceelement(file, sectionnumber);

	// Wait for the file to finish sending to the server
	xhr.addEventListener('load', function(e) {
	    //debugmsg.innerHTML += 'File '+file.name+' sent';
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
			} else {
			    resel.parent.removeChild(resel.li);
			    alert(result.error+': '+result.errormessage);
			}
		    }
		}
	    }
	};

	// Prepare the request to send to the server
	var date = new Date();
	var boundary = '----DNDUploadBoundary'+date.getTime();

	xhr.open("POST", this.serverurl+"/upload.php", true);
	xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary='+boundary);

	// When the file has been read into the browser
	// send it to the server
	var self = this;
	reader.onload = function(e) {
	    var result = e.target.result;
	    result = result.split(',',2)[1]; // Remove the 'data' section from the start

	    var data = '';
	    data += self.addpostfield(boundary, 'sesskey', self.sesskey);
	    data += self.addpostfield(boundary, 'course', self.courseid);
	    data += self.addpostfield(boundary, 'section', sectionnumber);
	    data += self.addpostfield(boundary, 'uploadfile[]', result, file.name, file.type);
	    data += '--'+boundary+'--';

	    xhr.send(data);
	}

	// Read the file into the browser
	reader.readAsDataURL(file);
    }

};