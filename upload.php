<?php

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
//require_once($CFG->libdir.'/formslib.php');
require_once($CFG->libdir.'/resourcelib.php');
require_once($CFG->dirroot.'/mod/resource/lib.php');
require_once($CFG->dirroot.'/mod/resource/locallib.php');
require_once($CFG->dirroot.'/course/lib.php');

$courseid = required_param('course', PARAM_INT);
$section = required_param('section', PARAM_INT);

function dnd_send_error($errcode, $errmsg) {
    $resp = new stdClass;
    $resp->error = $errcode;
    $resp->errormessage = $errmsg;
    echo json_encode($resp);
    die();
}

if (!$course = $DB->get_record('course', array('id' => $courseid))) {
    dnd_send_error(1, 'Course is misconfigured');
}

require_login($course, false);
$context = get_context_instance(CONTEXT_COURSE, $course->id);
if (!has_capability('moodle/course:manageactivities', $context)) {
    dnd_send_error(2, 'No permission to add resources');
}

if (!confirm_sesskey()) {
    dnd_send_error(5, 'Invalid sesskey');
}

// Extract the file data (and base64 decode it)
if (!array_key_exists('uploadfile', $_FILES)) {
    dnd_send_error(3, 'No files included');
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
    dnd_send_error(4, 'File not successfully uploaded');
}

$contents = file_get_contents($filesrc);
$contents = base64_decode($contents);

// Set up all the data for the resource
$cw = get_course_section($section, $course->id);

$data = new stdClass;
$data->course = $course->id;
$data->section = $section;
$data->module = $DB->get_field('modules', 'id', array('name'=>'resource'));
$data->modulename = 'resource';
$data->instance = 0;
$data->name = $displayname;
$data->visible = $cw->visible;
$data->groupmode = $course->groupmode;
$data->groupingid = $course->defaultgroupingid;
$data->groupmembersonly = 0;
$data->id = '';
$data->files = false;

// Create the course module
$data->coursemodule = add_course_module($data);

// Create the relevant files
$fs = get_file_storage();
$cmcontext = get_context_instance(CONTEXT_MODULE, $data->coursemodule);
$fileinfo = array(
                  'contextid' => $cmcontext->id,
                  'component' => 'mod_resource',
                  'filearea' => 'content',
                  'itemid' => 0,
                  'filepath' => '/',
                  'filename' => $filename
                  );
$fs->create_file_from_string($fileinfo, $contents);

// Create the resouce database entry
unset($data->id);
$data->display = RESOURCELIB_DISPLAY_AUTO;
$data->instance = resource_add_instance($data, $data);

// Update the 'instance' field for the course module
$DB->set_field('course_modules', 'instance', $data->instance, array('id'=>$data->coursemodule));

// Add the resource to the correct section
$sectionid = add_mod_to_section($data);
$DB->set_field('course_modules', 'section', $sectionid, array('id'=>$data->coursemodule));

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

$resp = new stdClass;
$resp->error = 0;
$resp->icon = $OUTPUT->pix_url(file_extension_icon($filename)).'';
$resp->filename = $displayname;
$resp->link = new moodle_url('/mod/resource/view.php', array('id'=>$data->coursemodule)).'';

echo json_encode($resp);