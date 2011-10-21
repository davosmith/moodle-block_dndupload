M.blocks_dndupload = {
    sesskey: null,
    serverurl: null,
    loadingimg: null,
    courseid: null,
    maxsize: null,
    addimg: null,
    entercount: 0, // Nasty hack to distinguish between dragenter(first entry), dragenter+dragleave(moving between child elements) and dragleave (leaving element)
    currentsection: null,
    realtype: null,

    init: function(Y, sesskey, serverurl, courseid, loadingimg, maxsize, addimg) {
        if (!this.hasRequiredFunctionality()) {
            document.getElementById('dndupload-status').innerHTML = M.util.get_string('nofilereader', 'block_dndupload');
            return;
        }

        if (!this.ajaxeditenabled()) {
            document.getElementById('dndupload-status').innerHTML = M.util.get_string('noajax', 'block_dndupload');
            return;
        }

        document.getElementById('dndupload-status').innerHTML = M.util.get_string('dndworking', 'block_dndupload');

        this.sesskey = sesskey;
        this.serverurl = serverurl;
        this.courseid = courseid;
        this.loadingimg = loadingimg;
        this.maxsize = maxsize;
        this.addimg = addimg;

        var els = document.getElementsByClassName('section');
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

    typesincludes: function(e, type) {
        var i;
        for (i=0; i<e.dataTransfer.types.length; i++) {
            if (e.dataTransfer.types[i] == type) {
                return true;
            }
        }
        return false;
    },

    dragtype: function(e) {
        if (this.typesincludes(e, 'Files')) {
            this.realtype = 'Files';
            return 'Files';
        }
        if (this.typesincludes(e, 'url')) {
            this.realtype = 'url';
            return 'url';
        }
        if (this.typesincludes(e, 'text/uri-list')) {
            this.realtype = 'text/uri-list';
            return 'url';
        }
        if (this.typesincludes(e, 'text/html')) {
            this.realtype = 'text/html';
            return 'text/html';
        }
        if (this.typesincludes(e, 'text')) {
            this.realtype = 'text';
            return 'text';
        }
        if (this.typesincludes(e, 'text/plain')) {
            this.realtype = 'text/plain';
            return 'text';
        }
        return false; // No types we can handle
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

        var type = this.dragtype(e);
        if (type) {
            this.showpreviewelement(section, type);
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

        var type = this.dragtype(e);
        if (!type) {
            return false;
        }

        var section = e.currentTarget;
        var sectionid = section.id.split('-');
        if (sectionid.length < 2 || sectionid[0] != 'section') {
            return false;
        }
        var sectionnumber = parseInt(sectionid[1]);

        if (type == 'Files') {
            var files = e.dataTransfer.files;
            for (var i=0, f; f=files[i]; i++) {
                this.uploadfile(f, section, sectionnumber);
            }
        } else {
            var contents = e.dataTransfer.getData(this.realtype);
            if (contents) {
                var message = M.util.get_string('nameforwebpage', 'block_dndupload');
                if (type == 'url') {
                    message = M.util.get_string('nameforlink', 'block_dndupload');
                }
                var name = prompt(message);
                if (name) {
                    this.uploaditem(name, type, contents, section, sectionnumber);
                }
            }
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
            var contentel = section.lastChild;
            var brel = contentel.lastChild;
            contentel.insertBefore(modsel, brel);
        }

        return modsel;
    },

    addresourceelement: function(name, section) {
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
        resel.namespan.innerHTML = name;
        resel.a.appendChild(resel.namespan);

        resel.div.appendChild(document.createTextNode(' '));

        resel.progressouter.className = 'dndupload-progress-outer';
        resel.progress.className = 'dndupload-progress-inner';
        resel.progress.innerHTML = '&nbsp;';
        resel.progressouter.appendChild(resel.progress);
        resel.div.appendChild(resel.progressouter);

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

    showpreviewelement: function(section, type) {
        this.hidepreviewelement();
        var lis = section.getElementsByTagName('li');
        for (var i=0; i<lis.length; i++) {
            if (lis[i].className.search('dndupload-preview') >= 0) {
                lis[i].className = lis[i].className.replace(' dndupload-hidden', '');
                var namespan = lis[i].getElementsByTagName('span')[0];
                switch (type) {
                case 'Files':
                    namespan.firstChild.nodeValue = M.util.get_string('addhere', 'block_dndupload');
                    break;
                case 'url':
                    namespan.firstChild.nodeValue = M.util.get_string('addlinkhere', 'block_dndupload');
                    break;
                case 'text':
                case 'text/html':
                    namespan.firstChild.nodeValue = M.util.get_string('addwebpagehere', 'block_dndupload');
                    break;
                }
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
        preview.namespan.innerHTML = M.util.get_string('addhere', 'block_dndupload');
        preview.div.appendChild(preview.namespan);

        modsel.appendChild(preview.li);
    },

    uploadfile: function(file, section, sectionnumber) {
        var xhr = new XMLHttpRequest();
        var self = this;

        if (file.name == '.ds_store') {
            return;
        }

        if (file.size > this.maxsize) {
            alert("'"+file.name+"' "+M.util.get_string('filetoolarge', 'block_dndupload'));
            return;
        }

        // Add the file to the display
        var resel = this.addresourceelement(file.name, section);

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
                            resel.namespan.innerHTML = result.name;
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
        formData.append('type', 'Files');

        xhr.open("POST", this.serverurl+"/upload.php", true);
        xhr.send(formData);
    },

    uploaditem: function(name, type, contents, section, sectionnumber) {
        var xhr = new XMLHttpRequest();
        var self = this;

        // Add the item to the display
        var resel = this.addresourceelement(name, section);

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    var result = JSON.parse(xhr.responseText);
                    if (result) {
                        if (result.error == 0) {
                            resel.icon.src = result.icon;
                            resel.a.href = result.link;
                            resel.namespan.innerHTML = result.name;
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
        formData.append('contents', contents);
        formData.append('displayname', name);
        formData.append('sesskey', this.sesskey);
        formData.append('course', this.courseid);
        formData.append('section', sectionnumber);
        formData.append('type', type);

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