<?php

function xmldb_block_dndupload_install() {
    global $CFG;

    if ($CFG->version > 2012062500) {
        die(get_string('notmoodle23', 'block_dndupload'));
    }
}