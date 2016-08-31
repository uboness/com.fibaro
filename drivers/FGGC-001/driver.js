"use strict";

const path			= require('path');
const ZwaveDriver	= require('homey-zwavedriver');

// http://www.pepper1.net/zwavedb/device/928

module.exports = new ZwaveDriver( path.basename(__dirname), {
	capabilities: {
	},
	settings: {
		"device_orientation": {
			"index": 1,
			"size": 1
		},
		"acoustic_signal": {
			"index": 2,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
		},
		"visual_signal": {
			"index": 3,
			"size": 1,
			"parser": function( value ){
				return new Buffer([ ( value === true ) ? 1 : 0 ]);
			}
		},
		"buzzer_behaviour": {
			"index": 4,
			"size": 1
		}
	}
});

module.exports.on('initNode', function( token ){
	var node = module.exports.nodes[ token ];
	if( node ) {
		node.instance.CommandClass['COMMAND_CLASS_CENTRAL_SCENE'].on('report', function( command, report ){
			if( command.name === 'CENTRAL_SCENE_NOTIFICATION' ) {
				var swiped = {
					"direction": report['Scene Number'].toString(),
					"scene": report.Properties1['Key Attributes']
				};
				if(report['Scene Number'] >= 1 && report['Scene Number'] <= 4) {
					Homey.manager('flow').triggerDevice('fggc-001_swipe_direction', null, swiped, node.device_data);
				} else {
					Homey.manager('flow').triggerDevice('fggc-001_swipe_round', null, swiped, node.device_data);
				}
			}
		});
	}
});

Homey.manager('flow').on('trigger.fggc-001_swipe_direction', function( callback, args, state ) {
	if(state.direction === args.direction && state.scene === args.scene) {
		callback(null, true);
		return;
	}
	callback(null, false);
});

Homey.manager('flow').on('trigger.fggc-001_swipe_round', function( callback, args, state ) {
	if(state.direction === args.direction && state.scene === args.scene) {
		callback(null, true);
		return;
	}
	callback(null, false);
});
