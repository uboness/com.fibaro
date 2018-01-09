'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');

// TODO multiChannelAssociation 1.2 -> listen for multi channel commands (not possible right now as the command classes change after setting mca 1.2)

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		measure_battery: {
			getOnStart: true,
			command_class: 'COMMAND_CLASS_BATTERY',
			command_get: 'BATTERY_GET',
			command_report: 'BATTERY_REPORT',
			command_report_parser: (report) => {
				if (report.hasOwnProperty('Battery Level (Raw)')) return report['Battery Level (Raw)'][0];
				return null;
			},
			pollInterval: 'poll_interval_battery'
		},
		measure_temperature: {
			getOnStart: true,
			command_class: 'COMMAND_CLASS_SENSOR_MULTILEVEL',
			command_get: 'SENSOR_MULTILEVEL_GET',
			command_get_parser: () => ({
				'Sensor Type': 'Temperature (version 1)',
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'SENSOR_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (report['Sensor Type'] !== 'Temperature (version 1)') return null;
				return report['Sensor Value (Parsed)'];
			},
			pollInterval: 'poll_interval_measure_temperature'
		},
		target_temperature: {
			getOnStart: true,
			pollInterval: 'poll_interval_target_temperature',
			command_class: 'COMMAND_CLASS_THERMOSTAT_SETPOINT',
			command_get: 'THERMOSTAT_SETPOINT_GET',
			command_get_parser: function () {
				return {
					'Level': {
						'Setpoint Type': 'Heating 1',
					}
				};
			},
			command_set: 'THERMOSTAT_SETPOINT_SET',
			command_set_parser: function (value, node) {

				module.exports.realtime(node.device_data, 'target_temperature', Math.round(value * 2) / 2);

				// Create value buffer
				let a = new Buffer(2);
				a.writeUInt16BE(( Math.round(value * 2) / 2 * 10).toFixed(0));

				return {
					'Level': {
						'Setpoint Type': 'Heating 1'
					},
					'Level2': {
						'Size': 2,
						'Scale': 0,
						'Precision': 1
					},
					'Value': a
				};
			},
			command_report: 'THERMOSTAT_SETPOINT_REPORT',
			command_report_parser: report => {
				if (report.hasOwnProperty('Level2')
					&& report.Level2.hasOwnProperty('Scale')
					&& report.Level2.hasOwnProperty('Precision')
					&& report.Level2['Scale'] === 0
					&& typeof report.Level2['Size'] !== 'undefined') {

					let readValue;
					try {
						readValue = report['Value'].readUIntBE(0, report.Level2['Size']);
					} catch (err) {
						return null;
					}

					if (typeof readValue !== 'undefined') {
						return readValue / Math.pow(10, report.Level2['Precision']);
					}
					return null;
				}
				return null;
			},
		},
	},
});
