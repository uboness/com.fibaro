'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// http://manuals.fibaro.com/content/manuals/en/FGPB-101/FGPB-101-EN-T-v1.0.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		measure_battery: {
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: report => {
				if (report['Battery Level'] === 'battery low warning') return 1;

				if (report.hasOwnProperty('Battery Level (Raw)')) { return report['Battery Level (Raw)'][0]; }

				return null;
			},
		},
	},
});

module.exports.on('initNode', (token) => {
	const node = module.exports.nodes[token];
	let debouncer = 0;

	if (node) {
		node.instance.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on('report', (command, report) => {
			if (command.name === 'CENTRAL_SCENE_NOTIFICATION') {

				if (report &&
					report.hasOwnProperty('Properties1') &&
					report.Properties1.hasOwnProperty('Key Attributes')) {

					const button_value = { scene: report.Properties1['Key Attributes'] };

					if (report.Properties1['Key Attributes'] === 'Key Released') {
						if (debouncer === 0) {
							Homey.manager('flow').triggerDevice('FGPB-101', null, button_value, node.device_data);

							debouncer++;
							setTimeout(() => debouncer = 0, 2000);
						}
					} else {
						Homey.manager('flow').triggerDevice('FGPB-101', null, button_value, node.device_data);
					}
				}
			}
		});
	}
});

Homey.manager('flow').on('trigger.FGPB-101', (callback, args, state) => {
	if (state && args &&
		state.hasOwnProperty('scene') &&
		args.hasOwnProperty('scene') &&
		state.scene === args.scene) { return callback(null, true); }

	return callback(null, false);
});
