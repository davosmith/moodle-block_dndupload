<?php

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once($CFG->libdir.'/resourcelib.php');
require_once($CFG->dirroot.'/mod/resource/lib.php');
require_once($CFG->dirroot.'/mod/resource/locallib.php');
require_once($CFG->dirroot.'/mod/url/lib.php');
require_once($CFG->dirroot.'/mod/url/locallib.php');
require_once($CFG->dirroot.'/mod/page/lib.php');
require_once($CFG->dirroot.'/course/lib.php');

$courseid = required_param('course', PARAM_INT);
$section = required_param('section', PARAM_INT);
$type = required_param('type', PARAM_TEXT);

define("DND_ERROR_BAD_COURSE", 1);
define("DND_ERROR_NO_PERMISSION", 2);
define("DND_ERROR_NO_FILES", 3);
define("DND_ERROR_INVALID_FILE", 4);
define("DND_ERROR_INVALID_SESSKEY", 5);
define("DND_ERROR_INVALID_SECTION", 6);
define("DND_ERROR_FILE_TOO_BIG", 7);
define("DND_ERROR_INVALID_TYPE", 8);

function dnd_send_error($errcode, $errmsg) {
    $resp = new stdClass;
    $resp->error = $errcode;
    $resp->errormessage = $errmsg;
    echo json_encode($resp);
    die();
}

if (!$course = $DB->get_record('course', array('id' => $courseid))) {
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

$display = false;
if ($type == 'Files') {
    // Extract the file data
    if (!array_key_exists('uploadfile', $_FILES)) {
        dnd_send_error(DND_ERROR_NO_FILES, 'No files included');
    }
    $filedetails = $_FILES['uploadfile'];

    $filename = $filedetails['name'][0];
    $filesrc = $filedetails['tmp_name'][0];

    $displayname = $filename;
    $extn = strrpos($displayname, '.');
    if ($extn !== false) {
        $displayname = substr($displayname, 0, $extn);
    }
    $displayname = str_replace('_', ' ', $displayname);

    if (!is_uploaded_file($filesrc)) {
        dnd_send_error(DND_ERROR_INVALID_FILE, 'File not successfully uploaded');
    }
    $icon = $OUTPUT->pix_url(file_extension_icon($filename)).'';
    $modulename = 'resource';

    $display = get_config('resource', 'display');

} else {
    $displayname = required_param('displayname', PARAM_TEXT);
    if ($type == 'url') {
        $contents = required_param('contents', PARAM_URL);
        $icon = $OUTPUT->pix_url(url_guess_icon($contents)).'';
        $modulename = 'url';
        $display = get_config('url', 'display');

    } else if ($type == 'text') {
        $contents = required_param('contents', PARAM_TEXT);
        $icon = $OUTPUT->pix_url('icon', 'page').'';
        $modulename = 'page';
        $display = get_config('page', 'display');

    } else if ($type == 'text/html') {
        $contents = required_param('contents', PARAM_CLEANHTML);
        $icon = $OUTPUT->pix_url('icon', 'page').'';
        $modulename = 'page';
        $display = get_config('page', 'display');

    } else {
        dnd_send_error(DND_ERROR_INVALID_TYPE, 'Invalid upload type');
    }
}

// Set up all the data for the activity
$cw = get_course_section($section, $course->id);

$data = new stdClass;
$data->course = $course->id;
$data->section = $section;
$data->module = $DB->get_field('modules', 'id', array('name'=>$modulename));
$data->modulename = $modulename;
$data->instance = 0;
$data->name = $displayname;
$data->intro = '<p>'.$displayname.'</p>';
$data->introformat = FORMAT_HTML;
$data->visible = $cw->visible;
$data->groupmode = $course->groupmode;
$data->groupingid = $course->defaultgroupingid;
$data->groupmembersonly = 0;
$data->id = '';
$data->files = false;

$data->printheading = false; // Added to avoid any warnings due to not setting them
$data->printintro = false;
$data->popupwidth = 620;  // Default values from mod/resource/lib.php
$data->popupheight = 450;

// Create the course module
$data->coursemodule = add_course_module($data);

unset($data->id);

$data->display = $display;
if ($data->display === false) {
    $data->display = RESOURCELIB_DISPLAY_AUTO;
}

if ($type == 'Files') {
    // Create the relevant file
    $fs = get_file_storage();
    $cmcontext = get_context_instance(CONTEXT_MODULE, $data->coursemodule);
    $fileinfo = array(
                      'contextid' => $cmcontext->id,
                      'component' => 'mod_resource',
                      'filearea' => 'content',
                      'itemid' => 0,
                      'filepath' => '/',
                      'filename' => $filename,
                      'userid' => $USER->id
                      );
    $fs->create_file_from_pathname($fileinfo, $filesrc);

    // Create the resouce database entry
    $data->instance = resource_add_instance($data, $data);

} else if ($type == 'url') {

    // Create the url database entry
    unset($data->id);
    $data->externalurl = $contents;
    $data->instance = url_add_instance($data, $data);

} else {

    // Create the page database entry
    unset($data->id);
    $data->page = array('text'=>$contents, 'itemid'=>false);
    if ($type == 'text') {
        $data->page['format'] = FORMAT_PLAIN;
    } else {
        $data->page['format'] = FORMAT_HTML;
    }
    $data->printheading = true;
    $data->printintro = false;
    $data->instance = page_add_instance($data, $data);
}

// Update the 'instance' field for the course module
$DB->set_field('course_modules', 'instance', $data->instance, array('id'=>$data->coursemodule));

// Add the resource to the correct section
$sectionid = add_mod_to_section($data);
$DB->set_field('course_modules', 'section', $sectionid, array('id'=>$data->coursemodule));

set_coursemodule_visible($data->coursemodule, $data->visible);

// Trigger mod_created event with information about this module.
$eventdata = new stdClass();
$eventdata->modulename = $data->modulename;
$eventdata->name       = $data->name;
$eventdata->cmid       = $data->coursemodule;
$eventdata->courseid   = $course->id;
$eventdata->userid     = $USER->id;
events_trigger('mod_created', $eventdata);

add_to_log($course->id, "course", "add mod",
           "../mod/{$data->modulename}/view.php?id=$data->coursemodule",
           "{$data->modulename} $data->instance");
add_to_log($course->id, $data->modulename, "add",
           "view.php?id=$data->coursemodule",
           "$data->instance", $data->coursemodule);

rebuild_course_cache($course->id);

$resp = new stdClass;
$resp->error = 0;
$resp->icon = $icon;
$resp->name = $displayname;
$resp->link = new moodle_url("/mod/{$data->modulename}/view.php", array('id'=>$data->coursemodule)).'';
$resp->elementid = 'module-'.$data->coursemodule;

$data->id = $data->coursemodule;
$data->groupmodelink = false; // Resources never have group modes
$resp->commands = make_editing_buttons($data, true, true, 0, $section);

echo json_encode($resp);