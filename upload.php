<?php

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once($CFG->dirroot.'/mod/resource/lib.php');
require_once($CFG->dirroot.'/course/lib.php');

$courseid = required_param('course', PARAM_INT);
$section = required_param('section', PARAM_INT);

define("DND_ERROR_BAD_COURSE", 1);
define("DND_ERROR_NO_PERMISSION", 2);
define("DND_ERROR_NO_FILES", 3);
define("DND_ERROR_INVALID_FILE", 4);
define("DND_ERROR_INVALID_SESSKEY", 5);
define("DND_ERROR_INVALID_SECTION", 6);
define("DND_ERROR_FILE_TOO_BIG", 7);

function dnd_send_error($errcode, $errmsg) {
    $resp = new stdClass;
    $resp->error = $errcode;
    $resp->errormessage = $errmsg;
    echo json_encode($resp);
    die();
}

if (!$course = get_record('course', 'id', $courseid)) {
    dnd_send_error(DND_ERROR_BAD_COURSE, 'Course is misconfigured');
}
if ($section < 0 || $section > $course->numsections) {
    dnd_send_error(DND_ERROR_INVALID_SECTION, 'Invalid section: '+$section);
}

require_login($course, false);
$context = get_context_instance(CONTEXT_COURSE, $course->id);
if (!has_capability('moodle/course:manageactivities', $context)) {
    dnd_send_error(DND_ERROR_NO_PERMISSION, 'No permission to add resources');
}

if (!confirm_sesskey()) {
    dnd_send_error(DND_ERROR_INVALID_SESSKEY, 'Invalid sesskey');
}

// Extract the file data
if (!array_key_exists('uploadfile', $_FILES)) {
    dnd_send_error(DND_ERROR_NO_FILES, 'No files included');
}
$filedetails = $_FILES['uploadfile'];

$filename = $filedetails['name'][0];
$filesrc = $filedetails['tmp_name'][0];
$filesize = $filedetails['size'][0];

$displayname = $filename;
$filename = clean_filename($filename);
$extn = strrpos($displayname, '.');
if ($extn !== false) {
    $displayname = substr($displayname, 0, $extn);
}
$displayname = str_replace('_', ' ', $displayname);

if (!is_uploaded_file($filesrc)) {
    dnd_send_error(DND_ERROR_INVALID_FILE, 'File not successfully uploaded');
}

if ($filesize > get_max_upload_file_size($CFG->maxbytes, $COURSE->maxbytes)) {
    dnd_send_error(DND_ERROR_FILE_TOO_BIG, 'File size too big');
}

// Create the relevant file
$destarea = $CFG->dataroot.'/'.$course->id.'/dndupload';
check_dir_exists($destarea, true, true);
if (file_exists($destarea.'/'.$filename)) {
    $extension = '';
    $extn = strrpos($filename, '.');
    if ($extn !== false) {
        $extension = substr($filename, $extn);
        $filename = substr($filename, 0, $extn);
    }
    $i = 1;
    while (file_exists($destarea.'/'.$filename.'_'.$i.$extension)) {
        $i++;
    }
    $filename = $filename.'_'.$i.$extension;
}
$destfile = $destarea.'/'.$filename;

if (!move_uploaded_file($filesrc, $destfile)) {
    dnd_send_error(DND_ERROR_INVALID_FILE, 'File not successfully uploaded');
}

// Set up all the data for the resource
$cw = get_course_section($section, $course->id);

$data = new stdClass;
$data->course = $course->id;
$data->section = $section;
$data->module = get_field('modules', 'id', 'name', 'resource');
$data->modulename = 'resource';
$data->instance = 0;
$data->name = $displayname;
$data->visible = $cw->visible;
$data->groupmode = $course->groupmode;
$data->groupingid = $course->defaultgroupingid;
$data->groupmembersonly = 0;
$data->id = '';
$data->files = false;
$data->type = 'file';
$data->windowpopup = false;
$data->reference = 'dndupload/'.$filename;

// Create the course module
$data->coursemodule = add_course_module($data);

// Create the resouce database entry
unset($data->id);
$data->instance = resource_add_instance($data, $data);

// Update the 'instance' field for the course module
set_field('course_modules', 'instance', $data->instance, 'id', $data->coursemodule);

// Add the resource to the correct section
$sectionid = add_mod_to_section($data);
set_field('course_modules', 'section', $sectionid, 'id', $data->coursemodule);

set_coursemodule_visible($data->coursemodule, $data->visible);

// Trigger mod_created event with information about this module.
$eventdata = new stdClass();
$eventdata->modulename = 'resource';
$eventdata->name       = $data->name;
$eventdata->cmid       = $data->coursemodule;
$eventdata->courseid   = $course->id;
$eventdata->userid     = $USER->id;
events_trigger('mod_created', $eventdata);

add_to_log($course->id, "course", "add mod",
           "../mod/resource/view.php?id=$data->coursemodule",
           "Resource $data->instance");
add_to_log($course->id, 'resource', "add",
           "view.php?id=$data->coursemodule",
           "$data->instance", $data->coursemodule);

rebuild_course_cache($course->id);

$icon = mimeinfo('icon', $data->reference);
if ($icon == 'unknown.gif') {
    $icon = '/f/web.gif';
} else {
    $icon = "/f/$icon";
}

$resp = new stdClass;
$resp->error = 0;
$resp->icon = $CFG->pixpath.$icon;
$resp->filename = $displayname;
$resp->link = $CFG->wwwroot.'/mod/resource/view.php?id='.$data->coursemodule.'';
$resp->elementid = 'module-'.$data->coursemodule;

$data->id = $data->coursemodule;
$data->groupmodelink = false; // Resources never have group modes
$resp->commands = make_editing_buttons($data, true, true, 0, $section);

echo json_encode($resp);