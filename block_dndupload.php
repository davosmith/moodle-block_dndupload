<?php

// This file is part of the dndupload block for Moodle
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.


class block_dndupload extends block_base {
    function init() {
        $this->title = get_string('pluginname', 'block_dndupload');
    }

    function applicable_formats() {
        return array('all' => true);
    }

    function user_can_addto($page) {
        return true;
    }

    function get_content() {
        global $PAGE, $CFG, $OUTPUT, $COURSE;

        if ($this->content !== NULL) {
            return $this->content;
        }

        if (!$PAGE->user_is_editing()) {
            return NULL;
        }

        $this->content = new stdClass;
        $this->content->footer = null;
        $this->content->text = '<div id="dndupload-status"><noscript>'.get_string('noscript', 'block_dndupload').'</noscript></div>';

        $context = get_context_instance(CONTEXT_COURSE, $COURSE->id);
        if (!has_capability('moodle/course:managefiles', $context)) {
            $this->content->text =  '<div id="dndupload-status">'.get_string('nopermission', 'block_dndupload').'</div>';
            return $this->content;
        }

        $jsmodule = array(
                          'name' => 'block_dndupload',
                          'fullpath' => new moodle_url('/blocks/dndupload/dndupload.js'),
                          'strings' => array(
                                             array('addhere', 'block_dndupload'),
                                             array('addlinkhere', 'block_dndupload'),
                                             array('addwebpagehere', 'block_dndupload'),
                                             array('dndworking', 'block_dndupload'),
                                             array('filetoolarge', 'block_dndupload'),
                                             array('nameforlink', 'block_dndupload'),
                                             array('nameforwebpage', 'block_dndupload'),
                                             array('nofilereader', 'block_dndupload'),
                                             array('noajax', 'block_dndupload')
                                             )
                          );
        $vars = array(
                      sesskey(),
                      $CFG->wwwroot.'/blocks/dndupload',
                      $COURSE->id,
                      $OUTPUT->pix_url('i/ajaxloader').'',
                      get_max_upload_file_size($CFG->maxbytes, $COURSE->maxbytes),
                      $OUTPUT->pix_url('t/addfile').'',
                      );
        $PAGE->requires->js_init_call('M.blocks_dndupload.init', $vars, true, $jsmodule);

        return $this->content;
    }

}
