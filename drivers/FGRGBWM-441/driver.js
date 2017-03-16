'use strict';

const path = require('path');
const ZwaveDriver = require('homey-zwavedriver');
const tinycolor = require('tinycolor2');
const deviceOptions = {};

// http://manuals.fibaro.com/content/manuals/en/FGRGBWM-441/FGRGBWM-441-EN-A-v1.01.pdf

module.exports = new ZwaveDriver(path.basename(__dirname), {
	capabilities: {
		onoff: {
			multiChannelNodeId: 1,
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: value => ({
				Value: (value > 0) ? 'on/enable' : 'off/disable',
			}),
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: report => {
				if (typeof report !== 'undefined' && typeof report.Value === 'string') {
					return report.Value === 'on/enable';
				} else if (report.hasOwnProperty('Value (Raw)') && typeof report['Value (Raw)'] !== 'undefined') {
					return report['Value (Raw)'][0] > 0;
				}
				return null;
			},
		},
		dim: {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
			command_get: 'SWITCH_MULTILEVEL_GET',
			command_set: 'SWITCH_MULTILEVEL_SET',
			command_set_parser: value => ({
				Value: Math.round(value * 99),
			}),
			command_report: 'SWITCH_MULTILEVEL_REPORT',
			command_report_parser: (report, node) => {
				if (typeof report !== 'undefined' && typeof report.Value === 'string') {
					return (report.Value === 'on/enable') ? 1.0 : 0.0;
				}

				// Setting on/off state when dimming
				if (!node.state.onoff || node.state.onoff !== (report['Value (Raw)'][0] > 0)) {
					node.state.onoff = (report['Value (Raw)'][0] > 0);
				}

				if (report.hasOwnProperty('Value (Raw)') && typeof report['Value (Raw)'] !== 'undefined') {
					return report['Value (Raw)'][0] / 99;
				}
				return null;
			},
		},
		light_saturation: [
			// red
			{
				multiChannelNodeId: 2,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('r', value, 'saturation', node),
			},
			// green
			{
				multiChannelNodeId: 3,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('g', value, 'saturation', node),
			},
			// blue
			{
				multiChannelNodeId: 4,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('b', value, 'saturation', node),
			},
			// white
			{
				multiChannelNodeId: 5,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('a', value, 'saturation', node),
			},
		],

		light_hue: [
			// red
			{
				multiChannelNodeId: 2,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('r', value, 'hue', node),
			},
			// green
			{
				multiChannelNodeId: 3,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('g', value, 'hue', node),
			},
			// blue
			{
				multiChannelNodeId: 4,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => colorSetParser('b', value, 'hue', node),
			},
		],
		light_temperature: [
			// red
			{
				multiChannelNodeId: 2,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => temperatureSetParser('r', value, node),
			},
			// green
			{
				multiChannelNodeId: 3,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => temperatureSetParser('g', value, node),
			},
			// blue
			{
				multiChannelNodeId: 4,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => temperatureSetParser('b', value, node),
			},
			// white
			{
				multiChannelNodeId: 5,
				command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL',
				command_set: 'SWITCH_MULTILEVEL_SET',
				command_set_parser: (value, node) => temperatureSetParser('w', value, node),
			},
		],
		measure_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_parser: () => ({
				Properties1: {
					Scale: 2,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: (report, node) => {
				if (report && report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale !== 2) {
					return null;
				}

				if (report && report.hasOwnProperty('Meter Value (Parsed)')) {
					return report['Meter Value (Parsed)'];
				}
				return null;
			},
		},
		meter_power: {
			command_class: 'COMMAND_CLASS_METER',
			command_get: 'METER_GET',
			command_get_parser: () => ({
				Properties1: {
					Scale: 0,
				},
			}),
			command_report: 'METER_REPORT',
			command_report_parser: report => {
				if (report && report.hasOwnProperty('Properties2') &&
					report.Properties2.hasOwnProperty('Scale') &&
					report.Properties2.Scale !== 0) {
					return null;
				}

				return report['Meter Value (Parsed)'];
			},
		},

		// Minimum required for light mode and inputs
		light_mode: {
			command_class: 'COMMAND_CLASS_BASIC'
		},
		'measure_voltage.input1': {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL'
		},
		'measure_voltage.input2': {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL'
		},
		'measure_voltage.input3': {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL'
		},
		'measure_voltage.input4': {
			command_class: 'COMMAND_CLASS_SWITCH_MULTILEVEL'
		},
	},

	beforeInit: (token, callback) => {
		const node = module.exports.nodes[token];

		if (node) {

			// create the default option object
			module.exports.getSettings(node.device_data, (err, settings) => {
				if (err) return console.error('error retrieving settings for device', err);

				deviceOptions[token] = {};
				deviceOptions[token].stripType = settings.strip_type || 'rgbw';
				deviceOptions[token].rgbWhiteTemp = settings.rgbw_white_temperature || true;
				deviceOptions[token].whiteTemp = settings.white_temperature || 'ww';
				deviceOptions[token].whiteSaturation = parseInt(settings.white_saturation) / 99 || 10;
				deviceOptions[token].calibrateWhite = parseInt(settings.calibrate_white) / 100 || 0;
				deviceOptions[token].colorPallet = settings.color_pallet || 'accurate';
				deviceOptions[token].hueCache = 0;
				deviceOptions[token].colorCache = {
					r: 0,
					g: 0,
					b: 0,
					w: 0
				};
				deviceOptions[token].realInputConfig1 = parseInt(settings.input_config_1) || 1;
				deviceOptions[token].realInputConfig2 = parseInt(settings.input_config_2) || 1;
				deviceOptions[token].realInputConfig3 = parseInt(settings.input_config_3) || 1;
				deviceOptions[token].realInputConfig4 = parseInt(settings.input_config_4) || 1;

				if (settings.strip_type && settings.strip_type.indexOf('rgb') < 0 && settings.strip_type !== 'cct') {
					if (settings.input_config_1 < 8) deviceOptions[token].realInputConfig1 += 8;
					if (settings.input_config_2 < 8) deviceOptions[token].realInputConfig2 += 8;
					if (settings.input_config_3 < 8) deviceOptions[token].realInputConfig3 += 8;
					if (settings.input_config_4 < 8) deviceOptions[token].realInputConfig4 += 8;
				}

				// If any of the inputs are analog add 8 to the other channels
				else if (settings.input_config_1 &&
					settings.input_config_2 &&
					settings.input_config_3 &&
					settings.input_config_4) {
					if (settings.input_config_1 === 8) {
						if (settings.input_config_2 < 8) deviceOptions[token].realInputConfig2 += 8;
						if (settings.input_config_3 < 8) deviceOptions[token].realInputConfig3 += 8;
						if (settings.input_config_4 < 8) deviceOptions[token].realInputConfig4 += 8;
					} else if (settings.input_config_2 === 8) {
						if (settings.input_config_1 < 8) deviceOptions[token].realInputConfig1 += 8;
						if (settings.input_config_3 < 8) deviceOptions[token].realInputConfig3 += 8;
						if (settings.input_config_4 < 8) deviceOptions[token].realInputConfig4 += 8;
					} else if (settings.input_config_3 === 8) {
						if (settings.input_config_1 < 8) deviceOptions[token].realInputConfig1 += 8;
						if (settings.input_config_2 < 8) deviceOptions[token].realInputConfig2 += 8;
						if (settings.input_config_4 < 8) deviceOptions[token].realInputConfig4 += 8;
					} else if (settings.input_config_4 === 8) {
						if (settings.input_config_1 < 8) deviceOptions[token].realInputConfig1 += 8;
						if (settings.input_config_2 < 8) deviceOptions[token].realInputConfig2 += 8;
						if (settings.input_config_3 < 8) deviceOptions[token].realInputConfig3 += 8;
					}
				}

				if (settings.strip_type === 'cct' && node.state.light_mode !== 'temperature') {
					node.state.light_mode = 'temperature';
					module.exports.realtime(node.device_data, 'light_mode', 'temperature');
				} else if (node.state.light_mode !== 'color') {
					node.state.light_mode = 'color';
					module.exports.realtime(node.device_data, 'light_mode', 'color');
				}
			});
		}

		// Initiate the device
		return callback();
	},

	settings: {
		strip_type: (newValue, oldValue, deviceData) => {
			const node = module.exports.nodes[deviceData.token];

			if (deviceOptions[deviceData.token].stripType !== newValue) {
				deviceOptions[deviceData.token].stripType = newValue;
			}

			// Update light_mode value
			if (newValue === 'cct' && node.state.light_mode !== 'temperature') {
				node.state.light_mode = 'temperature';
				module.exports.realtime(node.device_data, 'light_mode', 'temperature');
			} else if (node.state.light_mode !== 'color') {
				node.state.light_mode = 'color';
				module.exports.realtime(node.device_data, 'light_mode', 'color');
			}

			// Checksum for input type
			module.exports.getSettings(deviceData, (err, settings) => {
				if (err) return console.error('error retrieving settings for device', err);

				let send = null;
				let inputConfig1 = parseInt(settings.input_config_1 || 1);
				let inputConfig2 = parseInt(settings.input_config_2 || 1);
				let inputConfig3 = parseInt(settings.input_config_3 || 1);
				let inputConfig4 = parseInt(settings.input_config_4 || 1);

				// If the type is not rgb(w) or cct, add 8;
				if (newValue.indexOf('rgb') < 0 && newValue !== 'cct') {
					inputConfig1 += 8;
					inputConfig2 += 8;
					inputConfig3 += 8;
					inputConfig4 += 8;
				}

				// If any of the inputs are analog add 8 to the other channels
				else {
					if (inputConfig1 === 8) {
						if (inputConfig2 < 8) inputConfig2 += 8;
						if (inputConfig3 < 8) inputConfig3 += 8;
						if (inputConfig4 < 8) inputConfig4 += 8;
					} else if (inputConfig2 === 8) {
						if (inputConfig1 < 8) inputConfig1 += 8;
						if (inputConfig3 < 8) inputConfig3 += 8;
						if (inputConfig4 < 8) inputConfig4 += 8;
					} else if (inputConfig3 === 8) {
						if (inputConfig1 < 8) inputConfig1 += 8;
						if (inputConfig2 < 8) inputConfig2 += 8;
						if (inputConfig4 < 8) inputConfig4 += 8;
					} else if (inputConfig4 === 8) {
						if (inputConfig1 < 8) inputConfig1 += 8;
						if (inputConfig2 < 8) inputConfig2 += 8;
						if (inputConfig3 < 8) inputConfig3 += 8;
					}
				}

				// See if any values has changed from before and update it
				if (inputConfig1 !== deviceOptions[deviceData.token].realInputConfig1 ||
					inputConfig2 !== deviceOptions[deviceData.token].realInputConfig2 ||
					inputConfig3 !== deviceOptions[deviceData.token].realInputConfig3 ||
					inputConfig4 !== deviceOptions[deviceData.token].realInputConfig4) {
					send = true;

					// Update realInputs
					deviceOptions[deviceData.token].realInputConfig1 = inputConfig1;
					deviceOptions[deviceData.token].realInputConfig2 = inputConfig2;
					deviceOptions[deviceData.token].realInputConfig3 = inputConfig3;
					deviceOptions[deviceData.token].realInputConfig4 = inputConfig4;
				}

				// If value of parameter 14 needs to update, send it
				if (send) {
					// Create parameter value
					const configValue = new Buffer([
						(deviceOptions[deviceData.token].realInputConfig1 * 16 +
						deviceOptions[deviceData.token].realInputConfig2),
						(deviceOptions[deviceData.token].realInputConfig3 * 16 +
						deviceOptions[deviceData.token].realInputConfig4),
					]);

					// Send values
					if (node) {
						node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
							'Parameter Number': 14,
							Level: {
								Size: 2,
								Default: false,
							},
							'Configuration Value': configValue,

						}, (err, result) => {
							if (err) return console.error('failed_to_set_configuration_parameter');

							if (result === 'TRANSMIT_COMPLETE_OK') {
								// Update the setting inside homey if the parameter was send
								module.exports.setSettings(node.device_data, {
									input_config_1: inputConfig1.toString(),
									input_config_2: inputConfig2.toString(),
									input_config_3: inputConfig3.toString(),
									input_config_4: inputConfig4.toString(),
								});
							}
						});
					}
				}
			});
		},
		rgbw_white_temperature: (newValue, oldValue, deviceData) => {
			if (deviceOptions[deviceData.token].rgbWhiteTemp !== newValue) {
				deviceOptions[deviceData.token].rgbWhiteTemp = newValue;
			}
		},
		white_temperature: (newValue, oldValue, deviceData) => {
			if (deviceOptions[deviceData.token].whiteTemp !== newValue) {
				deviceOptions[deviceData.token].whiteTemp = newValue;
			}
		},
		calibrate_white: (newValue, oldValue, deviceData) => {
			if (deviceOptions[deviceData.token].calibrateWhite !== newValue / 100) {
				deviceOptions[deviceData.token].calibrateWhite = newValue / 100;
			}
		},
		white_saturation: (newValue, oldValue, deviceData) => {
			if (deviceOptions[deviceData.token].whiteSaturation !== newValue / 100) {
				deviceOptions[deviceData.token].whiteSaturation = newValue / 100;
			}
		},
		transition_mode: {
			index: 8,
			size: 1,
		},
		mode1_steps: {
			index: 9,
			size: 1,
			signed: false,
		},
		mode1_time: {
			index: 10,
			size: 2,
			signed: false,
		},
		mode2_range: {
			index: 11,
			size: 1,
			signed: false,
			parser: (newValue, newSettings) => {
				if (newSettings.mode2_time === '0') return 0;

				return new Buffer([newValue + newSettings.mode2_time]);
			},
		},
		mode2_transition_time: {
			index: 11,
			size: 1,
			signed: false,
			parser: (newValue, newSettings) => {
				if (newValue === '0') return 0;

				return new Buffer([newValue + newSettings.mode2_range]);
			},
		},
		maximum_brightness: {
			index: 12,
			size: 1,
			signed: false,
		},
		minimum_brightness: {
			index: 13,
			size: 1,
			signed: false,
		},
		input_config_1: {
			index: 14,
			size: 2,
			parser: (newValue, newSettings, deviceData) => {
				deviceOptions[deviceData.token].realInputConfig1 = parseInt(newValue) || 1;

				// If strip type is not rgb(w) or cct, add 8
				if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct' && parseInt(newValue) < 8) {
					if (deviceOptions[deviceData.token].realInputConfig1 < 8) deviceOptions[deviceData.token].realInputConfig1 += 8;
				}

				deviceOptions[deviceData.token].realInputConfig1 = parseInt(newSettings.input_config_1);
				deviceOptions[deviceData.token].realInputConfig2 = parseInt(newSettings.input_config_2);
				deviceOptions[deviceData.token].realInputConfig3 = parseInt(newSettings.input_config_3);
				// If value = 8 (analog) add 8 to the other values
				if (parseInt(newValue) === 8) {
					if (deviceOptions[deviceData.token].realInputConfig2 < 8) deviceOptions[deviceData.token].realInputConfig2 += 8;
					if (deviceOptions[deviceData.token].realInputConfig3 < 8) deviceOptions[deviceData.token].realInputConfig3 += 8;
					if (deviceOptions[deviceData.token].realInputConfig4 < 8) deviceOptions[deviceData.token].realInputConfig4 += 8;
				}

				// Return the value back
				const value = new Buffer(2);
				value.writeUIntBE(
					(deviceOptions[deviceData.token].realInputConfig1 * 4096) +
					(deviceOptions[deviceData.token].realInputConfig2 * 256) +
					(deviceOptions[deviceData.token].realInputConfig3 * 16) +
					deviceOptions[deviceData.token].realInputConfig4, 0, 2);

				return value;
			},
		},
		input_config_2: {
			index: 14,
			size: 2,
			parser: (newValue, newSettings, deviceData) => {
				deviceOptions[deviceData.token].realInputConfig2 = parseInt(newValue) || 1;

				// If strip type is not rgb(w) or cct, add 8
				if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct' && parseInt(newValue) < 8) {
					if (deviceOptions[deviceData.token].realInputConfig2 < 8) deviceOptions[deviceData.token].realInputConfig2 += 8;
				}

				deviceOptions[deviceData.token].realInputConfig1 = parseInt(newSettings.input_config_1);
				deviceOptions[deviceData.token].realInputConfig2 = parseInt(newSettings.input_config_2);
				deviceOptions[deviceData.token].realInputConfig3 = parseInt(newSettings.input_config_3);
				// If value = 8 (analog) add 8 to the other values
				if (parseInt(newValue) === 8) {
					if (deviceOptions[deviceData.token].realInputConfig1 < 8) deviceOptions[deviceData.token].realInputConfig1 += 8;
					if (deviceOptions[deviceData.token].realInputConfig3 < 8) deviceOptions[deviceData.token].realInputConfig3 += 8;
					if (deviceOptions[deviceData.token].realInputConfig4 < 8) deviceOptions[deviceData.token].realInputConfig4 += 8;
				}

				// Return the value back
				const value = new Buffer(2);
				value.writeUIntBE(
					(deviceOptions[deviceData.token].realInputConfig1 * 4096) +
					(deviceOptions[deviceData.token].realInputConfig2 * 256) +
					(deviceOptions[deviceData.token].realInputConfig3 * 16) +
					deviceOptions[deviceData.token].realInputConfig4, 0, 2);

				return value;
			},
		},
		input_config_3: {
			index: 14,
			size: 2,
			parser: (newValue, newSettings, deviceData) => {
				deviceOptions[deviceData.token].realInputConfig3 = parseInt(newValue) || 1;

				// If strip type is not rgb(w) or cct, add 8
				if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct' && parseInt(newValue) < 8) {
					if (deviceOptions[deviceData.token].realInputConfig3 < 8) deviceOptions[deviceData.token].realInputConfig3 += 8;
				}

				deviceOptions[deviceData.token].realInputConfig1 = parseInt(newSettings.input_config_1);
				deviceOptions[deviceData.token].realInputConfig2 = parseInt(newSettings.input_config_2);
				deviceOptions[deviceData.token].realInputConfig3 = parseInt(newSettings.input_config_3);
				// If value = 8 (analog) add 8 to the other values
				if (parseInt(newValue) === 8) {
					if (deviceOptions[deviceData.token].realInputConfig1 < 8) deviceOptions[deviceData.token].realInputConfig1 += 8;
					if (deviceOptions[deviceData.token].realInputConfig2 < 8) deviceOptions[deviceData.token].realInputConfig2 += 8;
					if (deviceOptions[deviceData.token].realInputConfig4 < 8) deviceOptions[deviceData.token].realInputConfig4 += 8;
				}

				// Return the value back
				const value = new Buffer(2);
				value.writeUIntBE(
					(deviceOptions[deviceData.token].realInputConfig1 * 4096) +
					(deviceOptions[deviceData.token].realInputConfig2 * 256) +
					(deviceOptions[deviceData.token].realInputConfig3 * 16) +
					deviceOptions[deviceData.token].realInputConfig4, 0, 2);

				return value;
			},
		},
		input_config_4: {
			index: 14,
			size: 2,
			parser: (newValue, newSettings, deviceData) => {
				deviceOptions[deviceData.token].realInputConfig4 = parseInt(newValue) || 1;

				// If strip type is not rgb(w) or cct, add 8
				if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct' && parseInt(newValue) < 8) {
					if (deviceOptions[deviceData.token].realInputConfig4 < 8) deviceOptions[deviceData.token].realInputConfig4 += 8;
				}

				deviceOptions[deviceData.token].realInputConfig1 = parseInt(newSettings.input_config_1);
				deviceOptions[deviceData.token].realInputConfig2 = parseInt(newSettings.input_config_2);
				deviceOptions[deviceData.token].realInputConfig3 = parseInt(newSettings.input_config_3);
				// If value = 8 (analog) add 8 to the other values
				if (parseInt(newValue) === 8) {
					if (deviceOptions[deviceData.token].realInputConfig1 < 8) deviceOptions[deviceData.token].realInputConfig1 += 8;
					if (deviceOptions[deviceData.token].realInputConfig2 < 8) deviceOptions[deviceData.token].realInputConfig2 += 8;
					if (deviceOptions[deviceData.token].realInputConfig3 < 8) deviceOptions[deviceData.token].realInputConfig3 += 8;
				}

				// Return the value back
				const value = new Buffer(2);
				value.writeUIntBE(
					(deviceOptions[deviceData.token].realInputConfig1 * 4096) +
					(deviceOptions[deviceData.token].realInputConfig2 * 256) +
					(deviceOptions[deviceData.token].realInputConfig3 * 16) +
					deviceOptions[deviceData.token].realInputConfig4, 0, 2);

				return value;
			},
		},
		save_state: {
			index: 16,
			size: 1,
		},
		input_threshold: {
			index: 43,
			size: 1,
			parser: newValue => new Buffer([newValue * 10]),
		},
		watt_report_interval: {
			index: 44,
			size: 1,
			signed: false,
		},
		kwh_threshold: {
			index: 45,
			size: 1,
			signed: false,
			parser: newValue => new Buffer([newValue * 100]),
		},
		color_pallet: (newValue, oldValue, deviceData) => {
			if (deviceOptions[deviceData.token].colorPallet !== newValue) {
				deviceOptions[deviceData.token].colorPallet = newValue;
			}
		},
	},
});

function colorSetParser(color, value, type, node) {
	// If deviceOptions are not there yet, abort
	if (!deviceOptions.hasOwnProperty(node.device_data.token)) return null;

	let rgb;

	// If the send type was hue
	if (type === 'hue') {
		deviceOptions[node.device_data.token].hueCache = value;
		setTimeout(() => {
			deviceOptions[node.device_data.token].hueCache = 0;
		}, 200);

		rgb = tinycolor({
			h: hueParser(value, 'set', node.device_data.token) || 0,
			s: (node.state.light_saturation || 1) * 100,
			v: (node.state.dim || 1) * 100,
		}).toRgb();
		if (deviceOptions[node.device_data.token].hueCache.w > 0) sendColor([0], [5], node);
	}

	// If the send type was saturation, allong side the hue command
	else if (deviceOptions[node.device_data.token].hueCache > 0 && type === 'saturation') {
		rgb = tinycolor({
			h: hueParser(deviceOptions[node.device_data.token].hueCache, 'set', node.device_data.token) || 0,
			s: value * 100,
			v: (node.state.dim || 1) * 100,
		}).toRgb();
		if (deviceOptions[node.device_data.token].hueCache.w > 0) sendColor([0], [5], node);
	}

	// If the send type was saturation
	else if (type === 'saturation') {
		rgb = tinycolor({
			h: hueParser(node.state.light_hue, 'set', node.device_data.token) || 0,
			s: value * 100,
			v: (node.state.dim || 1) * 100,
		}).toRgb();
		rgb.a = 0;
	}

	if (type === 'saturation' &&
		deviceOptions[node.device_data.token] &&
		deviceOptions[node.device_data.token].stripType.indexOf('w') >= 0 &&
		value < deviceOptions[node.device_data.token].whiteSaturation &&
		deviceOptions[node.device_data.token].hueCache === 0) {
		// Using alpha channel as the white channel
		rgb.r = rgb.r * value;
		rgb.g = rgb.g * value;
		rgb.b = rgb.b * value;
		rgb.a = Math.round((1 - value) * 99);
	}

	if (!node.state.light_mode || node.state.light_mode !== 'color') {
		node.state.light_mode = 'color';
		module.exports.realtime(node.device_data, 'light_mode', 'color');
	}

	return {
		Value: Math.round((rgb[color] / 255) * 99)
	};
}

function temperatureSetParser(color, value, node) {
	// If deviceOptions are not there yet, abort
	if (!deviceOptions.hasOwnProperty(node.device_data.token)) return null;

	// If there is only 1 color strip attached
	if (deviceOptions[node.device_data.token] && deviceOptions[node.device_data.token].stripType.indexOf('sc') >= 0) {
		// Set temperature to middle, since it is not being used
		if (node.state.light_temperature && node.state.light_temperature !== 0.5) {
			node.state.light_temperature = 0.5;
			module.exports.realtime(node.device_data, 'light_temperature', 0.5);
		}

		// Set dim level to the value it was put at
		if (node.state.dim && node.state.dim !== (1 - value)) {
			node.state.dim = 1 - value;
			module.exports.realtime(node.device_data, 'dim', 1 - value);
		}

		if (!node.state.light_mode || node.state.light_mode !== 'color') {
			node.state.light_mode = 'color';
			module.exports.realtime(node.device_data, 'light_mode', 'color');
		}

		if (color === deviceOptions[node.device_data.token].stripType.slice(2)) {
			return {
				Value: Math.round((node.state.dim || 1) * (1 - value) * 99)
			};
		}

		return {
			Value: 'off/disable'
		};
	}

	// If there is a correlated color temperature strip attached
	if (deviceOptions[node.device_data.token] && deviceOptions[node.device_data.token].stripType === 'cct') {
		if (!node.state.light_mode || node.state.light_mode !== 'temperature') {
			node.state.light_mode = 'temperature';
			module.exports.realtime(node.device_data, 'light_mode', 'temperature');
		}

		if (color === 'r' || color === 'g') return {
			Value: 'off/disable'
		};

		if (color === 'b') return {
			Value: Math.round((node.state.dim || 1) * (1 - value) * 99)
		};

		if (color === 'w') return {
			Value: Math.round((node.state.dim || 1) * value * 99)
		};
	}

	// If there is a RGB(W) strip attached
	if (deviceOptions[node.device_data.token] && deviceOptions[node.device_data.token].stripType.indexOf('rgb') >= 0) {
		let whiteValue = value;

		const whiteTemperature = deviceOptions[node.device_data.token].whiteTemp || 'ww';

		if (deviceOptions[node.device_data.token].rgbWhiteTemp === true &&
			deviceOptions[node.device_data.token].stripType.indexOf('w') >= 0) {
			let transitionValue;

			// Set initial temperature levels
			// Extra Warm White (+/- 2400K))
			if (whiteTemperature === 'eww') transitionValue = 0.96;

			// Warm White (+/- 2700k)
			if (whiteTemperature === 'ww') transitionValue = 0.9;

			// Neutral White (+/- 4000K)
			if (whiteTemperature === 'nw') transitionValue = 0.5;

			// Cold White (> 5500K)
			if (whiteTemperature === 'cw') transitionValue = 0.1;

			// Cap the calibration between 0 and 1
			transitionValue += Math.min(Math.max(deviceOptions[node.device_data.token].calibrateWhite, 0), 1);

			if (value > transitionValue) whiteValue = 1 - value;
		}

		if (!node.state.light_mode || node.state.light_mode !== 'temperature') {
			node.state.light_mode = 'temperature';
			module.exports.realtime(node.device_data, 'light_mode', 'temperature');
		}

		if (color === 'r') {
			const rgb = temperatureParser(value, (node.state.dim || 1));
			return {
				Value: rgb.r
			};
		}
		if (color === 'g') {
			const rgb = temperatureParser(value, (node.state.dim || 1));
			return {
				Value: rgb.g
			};
		}
		if (color === 'b') {
			const rgb = temperatureParser(value, (node.state.dim || 1));
			return {
				Value: rgb.b
			};
		}
		if (color === 'w' &&
			deviceOptions[node.device_data.token].rgbWhiteTemp === true &&
			deviceOptions[node.device_data.token].stripType.indexOf('w') >= 0) {
			return {
				Value: Math.min(Math.round((node.state.dim || 1) * (99 * whiteValue)), 99)
			};
		}

		return {
			Value: 'off/disable'
		};
	}
}

// Get and Report parser
module.exports.on('initNode', token => {
	const node = module.exports.nodes[token];

	if (node) {
		// Setting Temperature to a default value in the middle
		if (deviceOptions.hasOwnProperty(node.device_data.token) && deviceOptions[node.device_data.token].stripType !== 'cct') {
			if (!node.state.light_temperature) node.state.light_temperature = 0.5;
		}

		// RED
		if (typeof node.instance.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL !== 'undefined') {

			node.instance.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_GET();
			node.instance.MultiChannelNodes['2'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.on('report', (command, report) => {

				if (command.name && command.name === 'SWITCH_MULTILEVEL_REPORT' &&
					deviceOptions.hasOwnProperty(node.device_data.token)) {
					// Trigger on/off flows
					if (report['Value (Raw)'][0] > 0 && deviceOptions[node.device_data.token].colorCache.r === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_on', null, {
							input: '1'
						}, node.device_data);
					}

					if (report['Value (Raw)'][0] === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_off', null, {
							input: '1'
						}, node.device_data);
					}

					// Update cache
					deviceOptions[node.device_data.token].colorCache.r = (report['Value (Raw)'][0] || 0);

					// If analog input(s) are attached
					if (deviceOptions[node.device_data.token].realInputConfig1 === 8) {
						// Update the value of this input
						module.exports.realtime(node.device_data, 'measure_voltage.input1', valueToVolt(report['Value (Raw)'][0]));
						node.state['measure_voltage.input1'] = valueToVolt(report['Value (Raw)'][0]);
						// Trigger any flows that are used
						Homey.manager('flow').triggerDevice('RGBW_volt_input_1', {
							volt: valueToVolt(report['Value (Raw)'][0])
						}, null, node.device_data);
					}

					// If not analog input(s), update values in homey
					else updateValues(node);
				}
			});
		}

		// GREEN
		if (typeof node.instance.MultiChannelNodes['3'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL !== 'undefined') {

			node.instance.MultiChannelNodes['3'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_GET();
			node.instance.MultiChannelNodes['3'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.on('report', (command, report) => {

				if (command.name && command.name === 'SWITCH_MULTILEVEL_REPORT' &&
					deviceOptions.hasOwnProperty(node.device_data.token)) {
					// Trigger on/off flows
					if (report['Value (Raw)'][0] > 0 && deviceOptions[node.device_data.token].colorCache.g === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_on', null, {
							input: '2'
						}, node.device_data);
					}

					if (report['Value (Raw)'][0] === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_off', null, {
							input: '2'
						}, node.device_data);
					}

					// Update cache
					deviceOptions[node.device_data.token].colorCache.g = (report['Value (Raw)'][0] || 0);

					// If analog input(s) are attached
					if (deviceOptions[node.device_data.token].realInputConfig2 === 8) {
						// Update the value of this input
						module.exports.realtime(node.device_data, 'measure_voltage.input2', valueToVolt(report['Value (Raw)'][0]));
						node.state['measure_voltage.input2'] = valueToVolt(report['Value (Raw)'][0]);
						// Trigger any flows that are used
						Homey.manager('flow').triggerDevice('RGBW_volt_input_2', {
							volt: valueToVolt(report['Value (Raw)'][0])
						}, null, node.device_data);
					}

					// If not analog input(s), update values in homey
					else updateValues(node);
				}
			});
		}

		// BLUE
		if (typeof node.instance.MultiChannelNodes['4'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL !== 'undefined') {

			node.instance.MultiChannelNodes['4'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_GET();
			node.instance.MultiChannelNodes['4'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.on('report', (command, report) => {

				if (command.name && command.name === 'SWITCH_MULTILEVEL_REPORT' &&
					deviceOptions.hasOwnProperty(node.device_data.token)) {
					// Trigger on/off flows
					if (report['Value (Raw)'][0] > 0 && deviceOptions[node.device_data.token].colorCache.b === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_on', null, {
							input: '3'
						}, node.device_data);
					}

					if (report['Value (Raw)'][0] === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_off', null, {
							input: '3'
						}, node.device_data);
					}

					// Update cache
					deviceOptions[node.device_data.token].colorCache.b = (report['Value (Raw)'][0] || 0);

					// If analog input(s) are attached
					if (deviceOptions[node.device_data.token].realInputConfig3 === 8) {
						// Update the value of this input
						module.exports.realtime(node.device_data, 'measure_voltage.input3', valueToVolt(report['Value (Raw)'][0]));
						node.state['measure_voltage.input3'] = valueToVolt(report['Value (Raw)'][0]);
						// Trigger any flows that are used
						Homey.manager('flow').triggerDevice('RGBW_volt_input_3', {
							volt: valueToVolt(report['Value (Raw)'][0])
						}, null, node.device_data);
					}

					// If not analog input(s), update values in homey
					else updateValues(node);
				}
			});
		}

		// WHITE
		if (typeof node.instance.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL !== 'undefined') {

			node.instance.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_GET();
			node.instance.MultiChannelNodes['5'].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.on('report', (command, report) => {

				if (command.name && command.name === 'SWITCH_MULTILEVEL_REPORT' &&
					deviceOptions.hasOwnProperty(node.device_data.token)) {
					// Trigger on/off flows
					if (report['Value (Raw)'][0] > 0 && deviceOptions[node.device_data.token].colorCache.w === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_on', null, {
							input: '4'
						}, node.device_data);
					}

					if (report['Value (Raw)'][0] === 0) {
						Homey.manager('flow').triggerDevice('RGBW_input_off', null, {
							input: '4'
						}, node.device_data);
					}

					// Update cache
					deviceOptions[node.device_data.token].colorCache.w = (report['Value (Raw)'][0] || 0);

					// If analog input(s) are attached
					if (deviceOptions[node.device_data.token].realInputConfig4 === 8) {
						// Update the value of this input
						module.exports.realtime(node.device_data, 'measure_voltage.input4', valueToVolt(report['Value (Raw)'][0]));
						node.state['measure_voltage.input4'] = valueToVolt(report['Value (Raw)'][0]);
						// Trigger any flows that are used
						Homey.manager('flow').triggerDevice('RGBW_volt_input_4', {
							volt: valueToVolt(report['Value (Raw)'][0])
						}, null, node.device_data);
					}

					// If cct, update values in homey
					else if (deviceOptions[node.device_data.token].stripType === 'cct') {
						updateValues(node);
					}
				}
			});
		}
	}
});

function updateValues(node) {
	const hsv = tinycolor({
		r: deviceOptions[node.device_data.token].colorCache.r || 0,
		g: deviceOptions[node.device_data.token].colorCache.g || 0,
		b: deviceOptions[node.device_data.token].colorCache.b || 0,
	}).toHsv();

	// Update dim when driver starts and is (turned) on
	if (!node.state.hasOwnProperty('dim') || node.state.dim === 0) {
		const dim = Math.max(deviceOptions[node.device_data.token].colorCache.r, Math.max(deviceOptions[node.device_data.token].colorCache.g, deviceOptions[node.device_data.token].colorCache.b));
		node.state.dim = dim / 99;
	}

	// Update hue
	const hue = hueParser((hsv.h || 0), 'get', node.device_data.token);
	node.state.light_hue = hue;
	module.exports.realtime(node.device_data, 'light_hue', hue);

	// Update saturation
	node.state.light_saturation = Math.round(hsv.s * 100) / 100;
	module.exports.realtime(node.device_data, 'light_saturation', Math.round(hsv.s * 100) / 100);

	// Update Temperature in CCT mode
	if (deviceOptions.hasOwnProperty(node.device_data.token) &&
		deviceOptions[node.device_data.token].stripType === 'cct') {
		const value = (((node.state.dim || 99) - deviceOptions[node.device_data.token].colorCache.b) + deviceOptions[node.device_data.token].colorCache.w) / (node.state.dim * 2 || 198);

		node.state.light_temperature = Math.round(value * 100) / 100;
		module.exports.realtime(node.device_data, 'light_temperature', Math.round(value * 100) / 100);
	}
}

function valueToVolt(value) {
	return Math.round(value / 99 * 100) / 10;
}

// Specific output dimming flow card
Homey.manager('flow').on('action.RGBW_specific', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node) {
		if (args && args.hasOwnProperty('color') && args.hasOwnProperty('brightness')) {
			let mc = 1;

			switch (args.color) {
				case 'r':
					mc = 2;
					break;
				case 'g':
					mc = 3;
					break;
				case 'b':
					mc = 4;
					break;
				case 'w':
					mc = 5;
					break;
			}

			// If single color is used, but not that color changed, stop flow card
			if (deviceOptions[node.device_data.token].stripType.indexOf('sc') >= 0 &&
				args.color !== deviceOptions[node.device_data.token].stripType.slice(2)) {
				return callback('Color not in use', false);
			}

			// If strip = CCT but the color is red or green, stop flow card
			else if (deviceOptions[node.device_data.token].stripType === 'cct' && (args.color === 'r' || args.color === 'g')) {
				return callback('Color not in use', false);
			}

			// If strip = RGB and color was white, stop flow card
			else if (deviceOptions[node.device_data.token].stripType === 'rgb' && args.color === 'w') {
				return callback('Color not in use', false);
			}

			sendColor([Math.round(args.brightness * 99)], [mc], node, (err, triggered) => callback(err, triggered));
		} else return callback('No arguments found', false);
	} else return callback('No node found', false);
});

// Random color flow card
Homey.manager('flow').on('action.RGBW_random', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node && deviceOptions[node.device_data.token]) {
		if (deviceOptions[node.device_data.token].stripType.indexOf('rgb') < 0) {
			return callback('Only available in RGB(W) mode', false);
		}

		if (args && args.hasOwnProperty('range')) {
			// Create a random RGB color on full saturation
			const random = Math.round(Math.random() * 100) / 100 * 360;
			let rgb = tinycolor({
				h: random,
				s: 100,
				v: (node.state.dim || 1) * 100,
			}).toRgb();
			rgb.a = 0;

			// Random RGB color
			if (args.range === 'rgb') {
				sendColor([rgb.r, rgb.g, rgb.b, 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
			}

			// Random RGB color WITH white
			else if (args.range === 'rgbw') {
				if (deviceOptions[node.device_data.token].stripType !== 'rgbw') {
					return callback('Only available on RGBW mode', false);
				}

				sendColor([rgb.r, rgb.g, rgb.b, (node.state.dim || 1) * 99], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
			}

			// Random RGB color OR white
			else if (args.range === 'rgb-w') {
				if (deviceOptions[node.device_data.token].stripType !== 'rgbw') {
					return callback('Only available on RGBW mode', false);
				}

				const option = Math.round(Math.random());

				if (option !== 0) rgb = {
					r: 0,
					g: 0,
					b: 0,
					a: (node.state.dim * 99 || 99)
				};

				sendColor([rgb.r, rgb.g, rgb.b, rgb.a], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
			}

			// Random R G or B (or W) color
			else if (args.range.indexOf('r-g-b') >= 0) {
				let option,
					hue;

				// If it is an RGBW use one more option
				if (args.range.indexOf('w') >= 0) {
					if (deviceOptions[node.device_data.token].stripType !== 'rgbw') {
						return callback('Only available on RGBW mode', triggered);
					}

					option = Math.round(Math.random() * 4);
				} else option = Math.round(Math.random() * 3);

				switch (option) {
					case 0: {
						sendColor([99 * (node.state.dim || 1), 0, 0, 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 1: {
						sendColor([0, 99 * (node.state.dim || 1), 0, 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 2: {
						sendColor([0, 0, 99 * (node.state.dim || 1), 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 3: {
						sendColor([0, 0, 0, 99 * (node.state.dim || 1)], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
				}
			}

			// Random R, Y, G, C, B or M (or W) color
			else if (args.range.indexOf('r-y-g-c-b-m') >= 0) {
				let option;
				let hue = null;

				// If it is an RGBW use one more option
				if (args.range.indexOf('w') >= 0) {
					if (deviceOptions[node.device_data.token].stripType !== 'rgbw') {
						return callback('Only available on RGBW mode', triggered);
					}

					option = Math.round(Math.random() * 7);
				} else option = Math.round(Math.random() * 6);

				switch (option) {
					case 0: {
						sendColor([99 * (node.state.dim || 1), 0, 0, 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 1: {
						hue = 0.17;
						break;
					}
					case 2: {
						sendColor([0, 0, 99 * (node.state.dim || 1), 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 3: {
						hue = 0.50;
						break;
					}
					case 4: {
						sendColor([0, 0, 0, 99 * (node.state.dim || 1)], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
					case 5: {
						hue = 0.83;
						break;
					}
					case 6: {
						sendColor([0, 0, 0, 99 * (node.state.dim || 1)], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
						break;
					}
				}

				if (hue) {
					const rgb = tinycolor({
						h: hueParser(hue, 'set', node.device_data.token),
						s: 100,
						v: (node.state.dim || 1) * 100,
					}).toRgb();
				}

				sendColor([rgb.r, rgb.g, rgb.b, 0], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
			}
		} else return callback('Color was not send', false);
	} else return callback('Invalid device/Node not ready', false);
});

Homey.manager('flow').on('action.RGBW_animation', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node) {
		if (deviceOptions[node.device_data.token].stripType.indexOf('rgb') < 0) {
			return callback('Only available in RGB(W) mode', false);
		}

		if (deviceOptions[node.device_data.token].realInputConfig1 > 8 ||
			deviceOptions[node.device_data.token].realInputConfig2 > 8 ||
			deviceOptions[node.device_data.token].realInputConfig3 > 8 ||
			deviceOptions[node.device_data.token].realInputConfig4 > 8) {
			return callback('Only available when no analog inputs are being used', false);
		}

		if (args && args.hasOwnProperty('animation')) {
			// If stop animation is choosen
			if (args.animation === '0') {
				sendColor([
					deviceOptions[node.device_data.token].colorCache.r,
					deviceOptions[node.device_data.token].colorCache.g,
					deviceOptions[node.device_data.token].colorCache.b,
					deviceOptions[node.device_data.token].colorCache.a,
				], [2, 3, 4, 5], node, (err, triggered) => callback(err, triggered));
			} else if (node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION) {
				// If value = 11 select a random animation (between 6 and 10)
				if (args.animation === '11') args.animation = Math.round(Math.random() * (10 - 6) + 6);

				// Send parameter values to module
				node.instance.CommandClass.COMMAND_CLASS_CONFIGURATION.CONFIGURATION_SET({
					'Parameter Number': 72,
					Level: {
						Size: 1,
						Default: false,
					},
					'Configuration Value': new Buffer([parseInt(args.animation)]),

				}, (err, result) => {
					// If error, stop flow card
					if (err) {
						console.error(err);
						return callback(err, false);
					}

					// If properly transmitted, change the setting and finish flow card
					if (result === 'TRANSMIT_COMPLETE_OK') {
						return callback(null, true);
					}

					// No transmition, stop flow card
					return callback('Transmition Failed', false);
				});
			} else return callback('Invalid Animation', false);
		} else return callback('Invalid Animation', false);
	} else return callback('Invalid Device', false);
});

function sendColor(values, multiChannels, node, callback) {
	// Turn the device on if it is off, with sleep so only triggers once
	if (!node.state.onoff || node.state.onoff === false) {
		node.state.onoff = true;
	}

	if (typeof values === 'object' && typeof multiChannels === 'object') {
		for (let i = 0; i < values.length; i++) {
			if (multiChannels[i] && values[i] >= 0) {
				node.instance.MultiChannelNodes[multiChannels[i]].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({
					Value: values[i],

				}, (err, result) => {
					if (err) {
						Homey.error(err);
						if (typeof callback === 'function') return callback(err, false);
					}

					if (result === 'TRANSMIT_COMPLETE_OK') {
						if (typeof callback === 'function') return callback(null, true);
					} else if (typeof callback === 'function') return callback('Transmition Failed', false);
				});
			}
		}
	} else if (typeof callback === 'function') return callback('Something went wrong', false);
}

const hueCalibration = {
	// 'id': [red, orange, yellow, lime, green, turquoise, cyan, teal, blue, purple, pink, hotpink],
	accurate: [0, 4.17, 2.38, 1.32, 1.01, 1.23, 1.06, 0.99, 1.01, 0.95, 0.95, 0.94],
	huestrip: [0, 4.17, 2.78, 1.56, 1.19, 1.23, 1.43, 1.54, 1.17, 0.86, 0.86, 0.93],
	huee27v3: [0, 2.78, 2.08, 1.32, 1.15, 1.23, 1.39, 1.46, 1.06, 0.90, 0.86, 0.93],
};

function hueParser(value, type, token) {
	value = Math.round(value * 100) / 100;
	let amount = Math.round(value);
	if (type === 'set') amount = Math.round(value * 360);
	if (type === 'get') value = value / 360;

	if (!deviceOptions[token].hasOwnProperty('colorPallet') || !hueCalibration.hasOwnProperty(deviceOptions[token].colorPallet) ||
		deviceOptions[token].colorPallet === 'none') {
		if (type === 'set') return value * 360;
		if (type === 'get') return value;
	}

	const constant = hueCalibration[deviceOptions[token].colorPallet];

	// Red to Orange
	if (amount >= 0 && amount <= 30) {
		if (type === 'set') return value / (constant[0] - (Math.round((constant[0] - constant[1]) / 30 * 1000) / 1000) * amount) * 360;
		if (type === 'get') return value * (constant[0] - (Math.round((constant[0] - constant[1]) / 30 * 1000) / 1000) * amount);
	}
	// Orange to Yellow
	if (amount >= 31 && amount <= 60) {
		if (type === 'set') return value / (constant[1] - (Math.round((constant[1] - constant[2]) / 30 * 1000) / 1000) * (amount - 30)) * 360;
		if (type === 'get') return value * (constant[1] - (Math.round((constant[1] - constant[2]) / 30 * 1000) / 1000) * (amount - 30));
	}
	// Yellow to Lime
	if (amount >= 61 && amount <= 90) {
		if (type === 'set') return value / (constant[2] - (Math.round((constant[2] - constant[3]) / 30 * 1000) / 1000) * (amount - 60)) * 360;
		if (type === 'get') return value * (constant[2] - (Math.round((constant[2] - constant[3]) / 30 * 1000) / 1000) * (amount - 60));
	}
	// Lime to Green
	if (amount >= 91 && amount <= 120) {
		if (type === 'set') return value / (constant[3] - (Math.round((constant[3] - constant[4]) / 30 * 1000) / 1000) * (amount - 90)) * 360;
		if (type === 'get') return value * (constant[3] - (Math.round((constant[3] - constant[4]) / 30 * 1000) / 1000) * (amount - 90));
	}
	// Green to Green/Blue
	if (amount >= 121 && amount <= 150) {
		if (type === 'set') return value / (constant[4] - (Math.round((constant[4] - constant[5]) / 30 * 1000) / 1000) * (amount - 120)) * 360;
		if (type === 'get') return value * (constant[4] - (Math.round((constant[4] - constant[5]) / 30 * 1000) / 1000) * (amount - 120));
	}
	// Green/Blue to Cyan
	if (amount >= 151 && amount <= 180) {
		if (type === 'set') return value / (constant[5] - (Math.round((constant[5] - constant[6]) / 30 * 1000) / 1000) * (amount - 150)) * 360;
		if (type === 'get') return value * (constant[5] - (Math.round((constant[5] - constant[6]) / 30 * 1000) / 1000) * (amount - 150));
	}
	// Cyan to Teal
	if (amount >= 181 && amount <= 210) {
		if (type === 'set') return value / (constant[6] - (Math.round((constant[6] - constant[7]) / 30 * 1000) / 1000) * (amount - 180)) * 360;
		if (type === 'get') return value * (constant[6] - (Math.round((constant[6] - constant[7]) / 30 * 1000) / 1000) * (amount - 180));
	}
	// Teal to Blue
	if (amount >= 211 && amount <= 240) {
		if (type === 'set') return value / (constant[7] - (Math.round((constant[7] - constant[8]) / 30 * 1000) / 1000) * (amount - 210)) * 360;
		if (type === 'get') return value * (constant[7] - (Math.round((constant[7] - constant[8]) / 30 * 1000) / 1000) * (amount - 210));
	}
	// Blue to Purple
	if (amount >= 241 && amount <= 270) {
		if (type === 'set') return value / (constant[8] - (Math.round((constant[8] - constant[9]) / 30 * 1000) / 1000) * (amount - 240)) * 360;
		if (type === 'get') return value * (constant[8] - (Math.round((constant[8] - constant[9]) / 30 * 1000) / 1000) * (amount - 240));
	}
	// Purple to Pink
	if (amount >= 271 && amount <= 300) {
		if (type === 'set') return value / (constant[9] - (Math.round((constant[9] - constant[10]) / 30 * 1000) / 1000) * (amount - 270)) * 360;
		if (type === 'get') return value * (constant[9] - (Math.round((constant[9] - constant[10]) / 30 * 1000) / 1000) * (amount - 270));
	}
	// Pink to Hotpink
	if (amount >= 301 && amount <= 330) {
		if (type === 'set') return value / (constant[10] - (Math.round((constant[10] - constant[11]) / 30 * 1000) / 1000) * (amount - 300)) * 360;
		if (type === 'get') return value * (constant[10] - (Math.round((constant[10] - constant[11]) / 30 * 1000) / 1000) * (amount - 300));
	}
	// Hotpink to Red
	if (amount >= 331 && amount <= 360) {
		if (type === 'set') return value / (constant[11] - (Math.round((constant[11] - constant[0]) / 30 * 1000) / 1000) * (amount - 330)) * 360;
		if (type === 'get') return value * (constant[11] - (Math.round((constant[11] - constant[0]) / 30 * 1000) / 1000) * (amount - 330));
	}
}

function temperatureParser(value, dim) {
	const amount = Math.round(value * 100);

	// 6500K to 6050K
	if (value >= 0 && value <= 0.1) {
		return {
			r: 99 * dim,
			g: (53 - 0.3 * amount) * dim,
			b: (21 - 0.5 * amount) * dim,
		};
	}
	// 6050K to 5600K
	if (value >= 0.1 && value <= 0.2) {
		return {
			r: 99 * dim,
			g: (50 - 0.1 * (amount - 10)) * dim,
			b: (16 - 0.3 * (amount - 10)) * dim,
		};
	}
	// 5600K to 5150K
	if (value >= 0.2 && value <= 0.3) {
		return {
			r: 99 * dim,
			g: (49 - 0.5 * (amount - 20)) * dim,
			b: (13 - 0.4 * (amount - 20)) * dim,
		};
	}
	// 5150K to 4700K
	if (value >= 0.3 && value <= 0.4) {
		return {
			r: 99 * dim,
			g: (44 - 0.2 * (amount - 30)) * dim,
			b: (9 - 0.2 * (amount - 30)) * dim,
		};
	}
	// 4700K to 4250K
	if (value >= 0.4 && value <= 0.5) {
		return {
			r: 99 * dim,
			g: (42 - 0.3 * (amount - 40)) * dim,
			b: (7 - 0.2 * (amount - 40)) * dim,
		};
	}
	// 4250K to 3800K
	if (value >= 0.5 && value <= 0.6) {
		return {
			r: 99 * dim,
			g: (39 - 0.4 * (amount - 50)) * dim,
			b: (5 - 0.1 * (amount - 50)) * dim,
		};
	}
	// 3800K to 3350K
	if (value >= 0.6 && value <= 0.7) {
		return {
			r: 99 * dim,
			g: (35 - 0.2 * (amount - 60)) * dim,
			b: (4 - 0.1 * (amount - 60)) * dim,
		};
	}
	// 3350K to 2900K
	if (value >= 0.7 && value <= 0.8) {
		return {
			r: 99 * dim,
			g: (33 - 0.6 * (amount - 70)) * dim,
			b: (3 - 0.1 * (amount - 70)) * dim,
		};
	}
	// 2900K to 2450K
	if (value >= 0.8 && value <= 0.9) {
		return {
			r: 99 * dim,
			g: (27 - 0.2 * (amount - 80)) * dim,
			b: (2 - 0.1 * (amount - 80)) * dim,
		};
	}
	// 2450K to 2000K
	if (value >= 0.9 && value <= 1) {
		return {
			r: 99 * dim,
			g: (25 - 0.3 * (amount - 90)) * dim,
			b: (1 - 0.1 * (amount - 90)) * dim,
		};
	}
}

Homey.manager('flow').on('trigger.RGBW_input_on', (callback, args, state) => {
	if (args && args.hasOwnProperty('input') &&
		state && state.hasOwnProperty('input') &&
		args.input === state.input) {
		return callback(null, true);
	}
});

Homey.manager('flow').on('trigger.RGBW_input_off', (callback, args, state) => {
	if (args && args.hasOwnProperty('input') &&

		state && state.hasOwnProperty('input') &&
		args.input === state.input) {
		return callback(null, true);
	}
});

Homey.manager('flow').on('action.FGRGBWM-441_reset_meter', (callback, args) => {
	const node = module.exports.nodes[args.device.token];

	if (node &&
		node.instance &&
		node.instance.CommandClass &&
		node.instance.CommandClass.COMMAND_CLASS_METER) {
		node.instance.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
			if (err) return callback(err);

			// If properly transmitted, change the setting and finish flow card
			if (result === 'TRANSMIT_COMPLETE_OK') {
				return callback(null, true);
			}
			return callback('unknown_response');
		});
	} else return callback('unknown_error');
});
