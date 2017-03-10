'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://products.z-wavealliance.org/ProductManual/File?folder=&filename=Manuals/1655/FGGC-001-EN-T-v1.0.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		measure_battery: {
			getOnWakeUp: true,
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: (report, node) => {
				if (report &&
					report.hasOwnProperty('Battery Level') &&
					report['Battery Level'] === 'battery low warning') {
					if (node && node.hasOwnProperty('state') && (!node.state.hasOwnProperty('alarm_battery') || node.state.alarm_battery !== true)) {
						node.state.alarm_battery = true;
						module.exports.realtime(node.device_data, 'alarm_battery', true);
					}
					return 1;
				}
				if (report.hasOwnProperty('Battery Level (Raw)')) {
					if (node && node.hasOwnProperty('state') &&
						(!node.state.hasOwnProperty('alarm_battery') || node.state.alarm_battery !== false) &&
						report['Battery Level (Raw)'][0] > 5) {
						node.state.alarm_battery = false;
						module.exports.realtime(node.device_data, 'alarm_battery', false);
					}
					return report['Battery Level (Raw)'][0];
				}
				return null;
			},
		},
		alarm_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
		},
	},
	settings: {
		device_orientation: {
			index: 1,
			size: 1,
		},
		acoustic_signal: {
			index: 2,
			size: 1,
		},
		visual_signal: {
			index: 3,
			size: 1,
		},
		buzzer_behaviour: {
			index: 4,
			size: 1,
		},
		power_mode: {
			index: 5,
			size: 2,
		},
		power_save: {
			index: 6,
			size: 1,
		},
		enter_menu: {
			index: 7,
			size: 1,
			parser: value => new Buffer([(value === true) ? 0 : 1]),
		},
		gesture_up: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newValue) gestureValue += 1;
				if (newSettings['gesture_down']) gestureValue += 2;
				if (newSettings['gesture_left']) gestureValue += 4;
				if (newSettings['gesture_right']) gestureValue += 8;
				if (newSettings['gesture_cw']) gestureValue += 16;
				if (newSettings['gesture_ccw']) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		gesture_down: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newSettings['gesture_up']) gestureValue += 1;
				if (newValue) gestureValue += 2;
				if (newSettings['gesture_left']) gestureValue += 4;
				if (newSettings['gesture_right']) gestureValue += 8;
				if (newSettings['gesture_cw']) gestureValue += 16;
				if (newSettings['gesture_ccw']) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		gesture_left: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newSettings['gesture_up']) gestureValue += 1;
				if (newSettings['gesture_down']) gestureValue += 2;
				if (newValue) gestureValue += 4;
				if (newSettings['gesture_right']) gestureValue += 8;
				if (newSettings['gesture_cw']) gestureValue += 16;
				if (newSettings['gesture_ccw']) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		gesture_right: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newSettings['gesture_up']) gestureValue += 1;
				if (newSettings['gesture_down']) gestureValue += 2;
				if (newSettings['gesture_left']) gestureValue += 4;
				if (newValue) gestureValue += 8;
				if (newSettings['gesture_cw']) gestureValue += 16;
				if (newSettings['gesture_ccw']) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		gesture_cw: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newSettings['gesture_up']) gestureValue += 1;
				if (newSettings['gesture_down']) gestureValue += 2;
				if (newSettings['gesture_left']) gestureValue += 4;
				if (newSettings['gesture_right']) gestureValue += 8;
				if (newValue) gestureValue += 16;
				if (newSettings['gesture_ccw']) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		gesture_ccw: {
			index: 10,
			size: 1,
			parser: (newValue, newSettings) => {
				let gestureValue = 0;
				if (newSettings['gesture_up']) gestureValue += 1;
				if (newSettings['gesture_down']) gestureValue += 2;
				if (newSettings['gesture_left']) gestureValue += 4;
				if (newSettings['gesture_right']) gestureValue += 8;
				if (newSettings['gesture_cw']) gestureValue += 16;
				if (newValue) gestureValue += 32;

				return new Buffer([gestureValue]);
			},
		},
		double_up: {
			index: 12,
			size: 1,
			parser: (newValue, newSettings) => {
				let doubleValue = 0;
				if (!newValue) doubleValue += 1;
				if (!newSettings['double_down']) doubleValue += 2;
				if (!newSettings['double_left']) doubleValue += 4;
				if (!newSettings['double_right']) doubleValue += 8;

				return new Buffer([doubleValue]);
			},
		},
		double_down: {
			index: 12,
			size: 1,
			parser: (newValue, newSettings) => {
				let doubleValue = 0;
				if (!newSettings['double_up']) doubleValue += 1;
				if (!newValue) doubleValue += 2;
				if (!newSettings['double_left']) doubleValue += 4;
				if (!newSettings['double_right']) doubleValue += 8;

				return new Buffer([doubleValue]);
			},
		},
		double_left: {
			index: 12,
			size: 1,
			parser: (newValue, newSettings) => {
				let doubleValue = 0;
				if (!newSettings['double_up']) doubleValue += 1;
				if (!newSettings['double_down']) doubleValue += 2;
				if (!newValue) doubleValue += 4;
				if (!newSettings['double_right']) doubleValue += 8;

				return new Buffer([doubleValue]);
			},
		},
		double_right: {
			index: 12,
			size: 1,
			parser: (newValue, newSettings) => {
				let doubleValue = 0;
				if (!newSettings['double_up']) doubleValue += 1;
				if (!newSettings['double_down']) doubleValue += 2;
				if (!newSettings['double_left']) doubleValue += 4;
				if (!newValue) doubleValue += 8;

				return new Buffer([doubleValue]);
			},
		},
		value_on_up: {
			index: 20,
			size: 2,
		},
		value_off_up: {
			index: 21,
			size: 2,
		},
		value_on_down: {
			index: 22,
			size: 2,
		},
		value_off_down: {
			index: 23,
			size: 2,
		},
		value_on_left: {
			index: 24,
			size: 2,
		},
		value_off_left: {
			index: 25,
			size: 2,
		},
		value_on_right: {
			index: 26,
			size: 2,
		},
		value_off_right: {
			index: 27,
			size: 2,
		},
		sequence_1: {
			index: 31,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
		sequence_2: {
			index: 32,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
		sequence_3: {
			index: 33,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
		sequence_4: {
			index: 34,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
		sequence_5: {
			index: 35,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
		sequence_6: {
			index: 36,
			size: 2,
			parser: newValue => parseSequence(newValue),
		},
	}
});

module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];
	if (node && typeof node.instance.CommandClass.COMMAND_CLASS_CENTRAL_SCENE !== 'undefined') {

		node.instance.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			if (command.hasOwnProperty('name') && command.name === 'CENTRAL_SCENE_NOTIFICATION') {

				const swiped = {
					direction: report['Scene Number'].toString(),
					scene: report.Properties1['Key Attributes'],
				};

				if (report['Scene Number'] >= 1 && report['Scene Number'] <= 4) {
					Homey.manager('flow').triggerDevice('fggc-001_swipe_direction', null, swiped, node.device_data);
				} else if (report['Scene Number'] >= 5 && report['Scene Number'] <= 6) {
					Homey.manager('flow').triggerDevice('fggc-001_swipe_round', null, swiped, node.device_data);
				} else {
					Homey.manager('flow').triggerDevice('fggc-001_swipe_sequence', null, swiped, node.device_data);
				}
			}
		});
	}
});

module.exports.on('applicationUpdate', deviceData => {
	Homey.manager('flow').triggerDevice('fggc-001_swipe_sequence', null, { direction: '13' }, deviceData);
});

Homey.manager('flow').on('trigger.fggc-001_swipe_direction', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('direction') &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('direction') &&
		args.hasOwnProperty('scene') &&
		state.direction === args.direction &&
		state.scene === args.scene) {
		return callback(null, true);
	}
	return callback(null, false);
});

Homey.manager('flow').on('trigger.fggc-001_swipe_round', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('direction') &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('direction') &&
		args.hasOwnProperty('scene') &&
		state.direction === args.direction &&
		state.scene === args.scene) {
		return callback(null, true);
	}
	return callback(null, false);
});

Homey.manager('flow').on('trigger.fggc-001_swipe_sequence', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('direction') &&
		args.hasOwnProperty('direction') &&
		state.direction === args.direction) {
		return callback(null, true);
	}
	return callback(null, false);
});

function parseSequence(gestures) {
	if (gestures === 0) return new Buffer([0, 0]);

	const gesture = gestures.split(';').map(Number);
	if (gesture.length === 2) gesture.push(0);
	return new Buffer([gesture[0], gesture[1] * 16 + gesture[2]]);
}