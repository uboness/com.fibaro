'use strict';

// Athom includes
const Homey = require('homey');
const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Third party includes
const tinyColor = require('tinycolor2');
const tinyGradient = require('tinygradient');

class FibaroRGBWControllerDevice extends ZwaveDevice {
	
    onMeshInit() {
	    this.currentRGB = {
	        r: 0,
            g: 0,
            b: 0,
            a: 0
        };
		this.realInputConfigs = {
            "input1": null,
            "input2": null,
            "input3": null,
            "input4": null
        };
        this.temperatureGradient = tinyGradient([
            '#80c5fc',
            '#ffffff',
            '#ffe68b'
        ]);

        if (this.getSetting('strip_type') === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
            this.setCapabilityValue('light_mode', 'temperature');
        } else if (this.getCapabilityValue('light_mode') !== 'color') {
            this.setCapabilityValue('light_mode', 'color');
        }

        this._reloadRealInputConfig();

        /*
		================================================================
		Registering Flows
		================================================================
		 */
        this._onFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_on').register()
            .registerRunListener(this._onOffFlowRunListener);
        this._offFlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_input_off').register()
            .registerRunListener(this._onOffFlowRunListener);

        this._input1FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input1').register();
        this._input2FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input2').register();
        this._input3FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input3').register();
        this._input4FlowTrigger = new Homey.FlowCardTriggerDevice('RGBW_volt_input4').register();

        this._resetMeterAction = new Homey.FlowCardAction('FGRGBWM-441_reset_meter').register()
            .registerRunListener(this._resetMeterRunListener.bind(this));

        this._randomColorAction =  new Homey.FlowCardAction('RGBW_random').register()
            .registerRunListener(this._randomColorRunListener.bind(this));
        this._specificColorAction =  new Homey.FlowCardAction('RGBW_specific').register()
            .registerRunListener(this._specificColorRunListener.bind(this));
        this._animationAction =  new Homey.FlowCardAction('RGBW_animation').register()
            .registerRunListener(this._animationRunListener.bind(this));

        /*
        ================================================================
        Registering on/off
        ================================================================
        */
		this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
			multiChannelNodeId: 1
		});

        /*
        ================================================================
        Registering light_hue, light_saturation and dim
        ================================================================
        */
        this.registerMultipleCapabilityListener(['light_saturation', 'light_hue', 'dim'], async (value, opts) => {
            let red, green, blue, white;
            let hue, saturation, dim;

            // Dim value changed for temperature mode
            if (this.getCapabilityValue('light_mode') === 'temperature' && !value['light_hue'] && !value['light_saturation']) {
                let originalHSV = this._tempToHSV(this.getCapabilityValue('light_temperature'));
                let rgb = tinyColor({
                    h: originalHSV.h,
                    s: originalHSV.s,
                    v: (value.dim * 100)
                }).toRgb();

                red = (rgb.r / 255) * 99;
                green = (rgb.g / 255) * 99;
                blue = (rgb.b / 255) * 99;
                white = (rgb.a / 255) * 99;
            }
            // Light mode color or saturation/hue changed
            else if (this.getCapabilityValue('light_mode') === 'color' || value['light_hue'] || value['light_saturation']) {
                value['light_hue'] ? hue = value['light_hue'] : hue = false;
                value['light_saturation'] ? saturation = value['light_saturation'] : saturation = false;
                value['dim'] ? dim = value['dim'] : dim = false;

                let rgb = this._valuesToRGB(hue, saturation, dim);

                red = (rgb.r / 255) * 99;
                green = (rgb.g / 255) * 99;
                blue = (rgb.b / 255) * 99;
                white = (rgb.a / 255) * 99;

                this.setCapabilityValue('light_mode', 'color');
            }

            try {
                await this._sendColor(red, 2);
                this.currentRGB.r = red;
                await this._sendColor(green, 3);
                this.currentRGB.g = green;
                await this._sendColor(blue, 4);
                this.currentRGB.b = blue;
                await this._sendColor(white, 5);
                this.currentRGB.a = white;
            } catch (err) {
                this.log(err);
            }

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering light_temperature
        ================================================================
         */
        this.registerCapabilityListener('light_temperature', async (value, opts) => {
            this.setCapabilityValue('light_mode', 'temperature');
            let rgb = this._tempToRGB(value);

            let red = (rgb.r / 255) * 99;
            let green = (rgb.g / 255) * 99;
            let blue = (rgb.b / 255) * 99;
            let white = (rgb.a / 255) * 99;

            try {
                await this._sendColor(red, 2);
                await this._sendColor(green, 3);
                await this._sendColor(blue, 4);
                await this._sendColor(white, 5);
            } catch (err) {
                this.log(err);
            }

            return Promise.resolve();
        });

        this.registerCapabilityListener('light_mode', async (value, opts) => {
            if (value === 'color') {
                await this._sendColor(this.currentRGB.r, 2);
                await this._sendColor(this.currentRGB.g, 3);
                await this._sendColor(this.currentRGB.b, 4);
                await this._sendColor(this.currentRGB.a, 5);
            } else if (value === 'temperature') {
                let rgb = this._tempToRGB(this.getCapabilityValue('light_temperature'));

                let red = (rgb.r / 255) * 99;
                let green = (rgb.g / 255) * 99;
                let blue = (rgb.b / 255) * 99;
                let white = (rgb.a / 255) * 99;

                await this._sendColor(red, 2);
                await this._sendColor(green, 3);
                await this._sendColor(blue, 4);
                await this._sendColor(white, 5);
            }

            return Promise.resolve();
        });

        /*
        ================================================================
        Registering meter_power and measure_power
        ================================================================
         */
        this.registerCapability('meter_power', 'METER');
        this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

        /*
        ================================================================
        Registering light_mode and measure_voltage.input
        ================================================================
         */
        this.registerCapability('light_mode', 'BASIC');
        this.registerCapability('measure_voltage.input1', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL');
        this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL');

        /*
        ================================================================
        Registering report listeners for multichannel nodes
        ================================================================
         */
        this.registerMultiChannelReportListener(2, 'SWITCH_MULTILEVEL', 'SWITCH_MULTILEVEL_REPORT', (report) => this._reportParser(report, 2));
        this.registerMultiChannelReportListener(3, 'SWITCH_MULTILEVEL', 'SWITCH_MULTILEVEL_REPORT', (report) => this._reportParser(report, 3));
        this.registerMultiChannelReportListener(4, 'SWITCH_MULTILEVEL', 'SWITCH_MULTILEVEL_REPORT', (report) => this._reportParser(report, 4));
        this.registerMultiChannelReportListener(5, 'SWITCH_MULTILEVEL', 'SWITCH_MULTILEVEL_REPORT', (report) => this._reportParser(report, 5));

        /*
        ================================================================
        Registering settings with custom parsers
        ================================================================
         */
        this.registerSetting('strip_type', (value, settings) => {
            if (value === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
                this.setCapabilityValue('light_mode', 'temperature');
            } else if (this.getCapabilityValue('light_mode') !== 'color') {
                this.setCapabilityValue('light_mode', 'color');
            }

            if (this._reloadRealInputConfig()) {
                let zwaveValue = new Buffer([
                    this.realInputConfigs.input1 * 16 + this.realInputConfigs.input2,
                    this.realInputConfigs.input3 * 16 + this.realInputConfigs.input4
                ]);

                this.configurationSet({
                    index: 14,
                    size: 2
                }, zwaveValue);
            }
        });
        // Both connected to the same index
        this.registerSetting('mode2_range', (value, settings) => {
           if (zwaveObj.mode2_transition_time === '0') return 0;
           return new Buffer([value + zwaveObj.mode2_transition_time]);
        });
        this.registerSetting('mode2_transition_time', (value, settings) => {
            if (value === '0') return 0;
            return new Buffer([value + zwaveObj.mode2_transition_time]);
        });
        // Handles Z-Wave sending in parser method as multiple inputs end up at the same index
        this.registerSetting('input_config_1', (value, settings) => this._inputSettingParser(1, value, settings));
        this.registerSetting('input_config_2', (value, settings) => this._inputSettingParser(2, value, settings));
        this.registerSetting('input_config_3', (value, settings) => this._inputSettingParser(3, value, settings));
        this.registerSetting('input_config_4', (value, settings) => this._inputSettingParser(4, value, settings));
        this.registerSetting('input_threshold', value => new Buffer([value * 10]));
        this.registerSetting('kwh_threshold', value => new Buffer([value * 100]));
    }

    /*
    ================================================================
    Colour parsing
    ================================================================
     */
	_valuesToRGB(hue, saturation, dim) {
		if (!hue) hue = this.getCapabilityValue('light_hue');
        if (!saturation) saturation = this.getCapabilityValue('light_saturation');
        if (!dim) dim = this.getCapabilityValue('dim');

        return tinyColor({
            h: (hue * 360),
            s: (saturation * 100),
            v: (dim * 100),
        }).toRgb();
    }

    /*
    ================================================================
    Temperature parsing
    ================================================================
     */
    _tempToRGB(value) {
        let hsv = this.temperatureGradient.hsvAt(value)._originalInput;
        return tinyColor({
            h: hsv.h,
            s: hsv.s,
            v: this.getCapabilityValue('dim') * 100
        }).toRgb();
    }

    _tempToHSV(value) {
        let hsv = this.temperatureGradient.hsvAt(value)._originalInput;
        return tinyColor({
            h: hsv.h,
            s: hsv.s,
            v: this.getCapabilityValue('dim') * 100
        }).toHsv();
    }

    /*
    ================================================================
    Flow related methods
    ================================================================
     */
    _onOffFlowRunListener(args, state) {
        if (args && args.hasOwnProperty('input') &&
            state && state.hasOwnProperty('input') &&
            args.input === state.input) {
            return true
        }
        return false;
    }

    _resetMeterRunListener(args, state) {
        if (args.device === this && this.node && typeof this.node.CommandClass.COMMAND_CLASS_METER !== 'undefined') {
            this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
                if (err) throw new Error(err); return false;
                if (result === 'TRANSMIT_COMPLETE_OK') return true;
                return false;
            });
        }
    }

    _randomColorRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Random colors only available in RGB(W) mode');
        if (args.hasOwnProperty('range')) {
            let rgb = tinyColor({
                h: Math.round(Math.random() * 100) / 100 * 360,
                s: 100,
                v: (this.getCapabilityValue('dim') || 1) * 100
            }).toRgb();

            if (args.range === 'rgb') {
                this._sendColor(rgb.r, 2);
                this._sendColor(rgb.g, 3);
                this._sendColor(rgb.b, 4);
            } else if (args.range === 'rgbw' && this.getSetting('strip_type') === 'rgbw') {
                this._sendColor(rgb.r, 2);
                this._sendColor(rgb.g, 3);
                this._sendColor(rgb.b, 4);
                this._sendColor(rgb.a, 5);
            } else if (args.range === 'rgb-w' && this.getSetting('strip_type') === 'rgbw') {
                let randomDecision = Math.round(Math.random());

                if (randomDecision !== 0) {
                    this._sendColor(0, 2);
                    this._sendColor(0, 3);
                    this._sendColor(0, 4);
                } else {
                    this._sendColor(rgb.r, 2);
                    this._sendColor(rgb.g, 3);
                    this._sendColor(rgb.b, 4);
                }

                this._sendColor(rgb.a, 5);
            } else if (args.range.indexOf('r-g-b') >= 0) {
                let option;

                args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 4) : option = Math.round(Math.random() * 3);

                switch (option) {
                    case 0: rgb.r = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 1: rgb.g = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 2: rgb.b = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 3: rgb.a = 99 * (this.getCapabilityValue('dim') || 1); break;
                }

                this._sendColor(rgb.r, 2);
                this._sendColor(rgb.g, 3);
                this._sendColor(rgb.b, 4);
                this._sendColor(rgb.a, 5);
            } else if (args.range.indexOf('r-y-g-c-b-m') >= 0) {
                let option, hue;

                args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 7) : option = Math.round(Math.random() * 6);

                switch (option) {
                    case 0: rgb.r = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 1: hue = .125; break;
                    case 2: rgb.g = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 3: hue = .5; break;
                    case 4: rgb.b = 99 * (this.getCapabilityValue('dim') || 1); break;
                    case 5: hue = .875; break;
                    case 6: rgb.a = 99 * (this.getCapabilityValue('dim') || 1); break;
                }

                if (hue) rgb = tinyColor({h: hue, s: 100, v: (this.getCapabilityValue('dim') || 1) * 100}).toRgb();

                this._sendColor(rgb.r, 2);
                this._sendColor(rgb.g, 3);
                this._sendColor(rgb.b, 4);
                this._sendColor(rgb.a, 5);
            }
        }
    }

    _specificColorRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (args && args.hasOwnProperty('color') && args.hasOwnProperty('brightness')) {
            let multiChannel;
            let stripType = this.getSetting('strip_type');

            switch(args.color) {
                case 'r': multiChannel = 2; break;
                case 'g': multiChannel = 3; break;
                case 'b': multiChannel = 4; break;
                case 'w': multiChannel = 5; break;
            }

            if (stripType.indexOf('sc') >= 0 && args.color !== stripType.slice(2)) return Promise.reject('Color not in use');
            if (stripType.indexOf('cct') >= 0 && (args.color === 'r' || args.color === 'g')) return Promise.reject('Color not in use');
            if (stripType === 'rgb' && args.color === 'w') return Promise.reject('Color not in use');

            return this._sendColor(Math.round(args.brightness * 99), multiChannel);
        }
    }

    _animationRunListener(args, state) {
        if (args.device !== this) return Promise.reject('Not the right device');
        if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Animations only available in RGB(W) mode');
        if ((this.realInputConfigs.input1 || this.realInputConfigs.input2 || this.realInputConfigs.input3 || this.realInputConfigs.input4) > 8) {
            return Promise.reject('Animations only available without analog input');
        }

        if (args && args.hasOwnProperty('animation')) {
            if (args.animation === '0') {
                try {
                    this._sendColor(this.currentRGB.r, 2);
                    this._sendColor(this.currentRGB.g, 3);
                    this._sendColor(this.currentRGB.b, 4);
                    this._sendColor(this.currentRGB.a, 5);
                    return Promise.resolve();
                } catch (err) {
                    return Promise.reject(err);
                }
            }
            if (args.animation === '11') {
                args.animation = Math.round(Math.random() * (10-6) + 6);
            }

            try {
                this.configurationSet({
                    index: 72,
                    size: 1
                }, new Buffer([parseInt(args.animation)]));
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }


    /*
    ================================================================
    Helper methods
    ================================================================
     */
    _valueToVolt(value) {
        return Math.round(value / 99 * 100) / 10;
    }

    _reloadRealInputConfig() {
        let newInputConfig = {};

        newInputConfig.input1= parseInt(this.getSetting('input_config_1') || 1);
        newInputConfig.input2= parseInt(this.getSetting('input_config_2') || 1);
        newInputConfig.input3= parseInt(this.getSetting('input_config_3') || 1);
        newInputConfig.input4= parseInt(this.getSetting('input_config_4') || 1);

        if (this.getSetting('strip_type') !== 'cct' && this.getSetting('strip_type').indexOf('rgb') < 0) {
            newInputConfig.input1 += 8;
            newInputConfig.input2 += 8;
            newInputConfig.input3 += 8;
            newInputConfig.input4 += 8;
        }

        if (newInputConfig.input1 !== this.realInputConfigs.input1 ||
                newInputConfig.input2 !== this.realInputConfigs.input2 ||
                newInputConfig.input3 !== this.realInputConfigs.input3 ||
                newInputConfig.input4 !== this.realInputConfigs.input4) {
                    this.realInputConfigs = newInputConfig;
                    return true;
        }
        return false;
    }

    async _sendColor(value, multiChannel) {
        this.node.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({Value: value}, (err, result) => {
            if (err) return Promise.reject(`Error whilst setting channel ${multiChannel}: ${err}`);
            else return Promise.resolve(result);
        });
    }

    _inputSettingParser(inputNumber, value, settings) {
        this.realInputConfigs[`input${inputNumber}`] = parseInt(value) || 1;

        if (newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct') {
            this.realInputConfigs[`input${inputNumber}`] += 8;
        }

        let zwaveValue = new Buffer([
            (this.realInputConfigs.input1 * 16 +
                this.realInputConfigs.input2),
            (this.realInputConfigs.input3 * 16 +
                this.realInputConfigs.input4)
        ]);

        try {
            this.configurationSet({
                index: 14,
                size: 2
            }, zwaveValue);
        } catch (err) {
            this.log(err);
        }
    }

    _reportParser(report, channel) {
        let red, green, blue, white;
        let inputNumber = channel - 1;

        switch (channel) {
            case 2: red = report['Value (Raw)'][0]; break;
            case 3: green = report['Value (Raw)'][0]; break;
            case 4: blue = report['Value (Raw)'][0]; break;
            case 5: white = report['Value (Raw)'][0]; break;
        }

        // Check if we should trigger an on/off flow for inputs
        if (this.currentRGB.r === 0 && red > 0 ||
            this.currentRGB.g === 0 && green > 0 ||
            this.currentRGB.b === 0 && blue > 0 ||
            this.currentRGB.a === 0 && white > 0) {
                this._onFlowTrigger.trigger(this, null, {input: inputNumber});
        } else if (this.currentRGB.r > 0 && red === 0 ||
            this.currentRGB.g > 0 && green === 0 ||
            this.currentRGB.b > 0 && blue === 0 ||
            this.currentRGB.a > 0 && white === 0) {
                this._offFlowTrigger.trigger(this, null, {input: inputNumber});
        }

        if (typeof red === 'number') this.currentRGB.r = red;
        if (typeof green === 'number') this.currentRGB.g = green;
        if (typeof blue === 'number') this.currentRGB.b = blue;
        if (typeof white === 'number') this.currentRGB.a = white;

        // Calculate the new HSV value
        let newColour = tinyColor({
            r: (this.currentRGB.r),
            g: (this.currentRGB.g),
            b: (this.currentRGB.b),
            a: (this.currentRGB.a)
        }).toHsv();

        this.setCapabilityValue('light_hue', newColour.h / 360);
        this.setCapabilityValue('light_saturation', newColour.s);

        if (this.getCapabilityValue('dim') === 0) {
            this.setCapabilityValue('onoff', true);
            this.setCapabilityValue('dim', newColour.v);
        }

        if (this.realInputConfigs[`input${inputNumber}`] === 8) {
            this.setCapabilityValue('measure_voltage.input1', this._valueToVolt(report['Value (Raw)'][0]));
            this[`input${inputNumber}FlowTrigger`].trigger(this, {volt: this._valueToVolt(report['Value (Raw)'][0])}, null);
        }
    }
}

module.exports = FibaroRGBWControllerDevice;