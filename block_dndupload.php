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
        $this->version = 2011102100;
    }

    function applicable_formats() {
        return array('course' => true, 'course-category' => false);
    }

    function user_can_addto($page) {
        return true;
    }

    function get_content() {
        global $CFG, $COURSE, $USER;

        if ($this->content !== NULL) {
            return $this->content;
        }

        if (!isediting()) {
            return NULL;
        }

        $this->content = new stdClass;
        $this->content->footer = null;
        $this->content->text = '<div id="dndupload-status"><noscript>'.get_string('noscript', 'block_dndupload').'</noscript></div>';

        /*
        $jsmodule = array(
                          'name' => 'block_dndupload',
                          );
        $PAGE->requires->js_init_call('M.blocks_dndupload.init', $vars, true, $jsmodule);
        */

        $strings = array(
                           array('addhere', 'block_dndupload'),
                           array('dndworking', 'block_dndupload'),
                           array('filetoolarge', 'block_dndupload'),
                           array('nofilereader', 'block_dndupload'),
                           array('noajax', 'block_dndupload')
                          );
        $vars = array(
                      sesskey(),
                      $CFG->wwwroot.'/blocks/dndupload',
                      $COURSE->id,
                      $CFG->pixpath.'/i/ajaxloader.gif',
                      get_max_upload_file_size($CFG->maxbytes, $COURSE->maxbytes),
                      $CFG->wwwroot.'/blocks/dndupload/pix/addfile.png',
                      );
        require_js($CFG->wwwroot.'/blocks/dndupload/dndupload.js');
        $this->content->text .= "\n<script type='text/javascript'>\n";
        foreach ($strings as $string) {
            $this->content->text .= 'blocks_dndupload.init_string("'.$string[0].'", "'.get_string($string[0], $string[1])."\");\n";
        }
        $this->content->text .= 'window.onload = function() { blocks_dndupload.init("'.implode('", "', $vars)."\"); }\n";
        $this->content->text .= "</script>\n";

        return $this->content;
    }

}
