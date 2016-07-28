"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/928

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
	}
})

// bind Flow
module.exports.on('initNode', function( token ){

	var node = module.exports.nodes[ token ];
	if( node ) {
		node.instance.CommandClass['COMMAND_CLASS_CENTRAL_SCENE'].on('report', function( command, report ){
			if( command.name === 'CENTRAL_SCENE_NOTIFICATION' ) {

				var trigger = 'fggc-001_';

				switch( report['Scene Number'] ) {
					case 1:
						trigger += 'up';
						break;
					case 2:
						trigger += 'down';
						break;
					case 3:
						trigger += 'left';
						break;
					case 4:
						trigger += 'right';
						break;
				}

				Homey.manager('flow').triggerDevice(trigger, null, null, node.device_data);
			}
		});
	}
})