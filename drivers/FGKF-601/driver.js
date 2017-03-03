'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// Documentation: http://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2120/FGKF-601-EN-T-v1.0_30.11.2016.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	debug: true,
	capabilities: {
		measure_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: report => {
				if (report['Battery Level'] === 'battery low warning') return 1;
				if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
				return null;
			},
		},
	},
	settings: {
		1: {
			index: 1,
			size: 2,
		},
		2: {
			index: 2,
			size: 2,
		},
		3: {
			index: 3,
			size: 2,
		},
		4: {
			index: 4,
			size: 2,
		},
		5: {
			index: 5,
			size: 2,
		},
		6: {
			index: 6,
			size: 2,
		},
		7: {
			index: 7,
			size: 2,
		},
		8: {
			index: 8,
			size: 2,
		},
		9: {
			index: 9,
			size: 1,
		},
		10: {
			index: 10,
			size: 1,
		},
		11: {
			index: 11,
			size: 2,
		},
		12: {
			index: 12,
			size: 2,
		},
		13: {
			index: 13,
			size: 2,
		},
		14: {
			index: 14,
			size: 2,
		},
		15: {
			index: 15,
			size: 2,
		},
		16: {
			index: 16,
			size: 2,
		},
		17: {
			index: 17,
			size: 1,
		},
		18: {
			index: 18,
			size: 1,
		},
		19: {
			index: 19,
			size: 1,
		},
		21: {
			index: 21,
			size: 1,
		},
		22: {
			index: 22,
			size: 1,
		},
		23: {
			index: 23,
			size: 1,
		},
		24: {
			index: 24,
			size: 1,
		},
		25: {
			index: 25,
			size: 1,
		},
		26: {
			index: 26,
			size: 1,
		},
		29: {
			index: 29,
			size: 2,
		},
	},
});

module.exports.on('initNode', (token) => {
	const node = module.exports.nodes[token];

	if (node) {
		node.instance.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {
				if (report &&
					report.hasOwnProperty('Properties1') &&
					report.Properties1.hasOwnProperty('Key Attributes')) {

					const button_value = { scene: report.Properties1['Key Attributes'] };

					if (report['Scene Number'] === 1)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_square', null, button_value, node.device_data);
					if (report['Scene Number'] === 2)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_circle', null, button_value, node.device_data);
					if (report['Scene Number'] === 3)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_cross', null, button_value, node.device_data);
					if (report['Scene Number'] === 4)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_triangle', null, button_value, node.device_data);
					if (report['Scene Number'] === 5)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_minus', null, button_value, node.device_data);
					if (report['Scene Number'] === 6)
						Homey.manager('flow').triggerDevice('FGKF-601_button_press_plus', null, button_value, node.device_data);

				}
			}
		});
	}
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_square', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_circle', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_cross', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_triangle', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_minus', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});

Homey.manager('flow').on('trigger.FGKF-601_button_press_plus', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});
