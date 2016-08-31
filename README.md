# Fibaro
This app adds support for Fibaro devices in Homey.

# Supported devices with parameters:
* FGD-211, Dimmer
* FGD-212, Dimmer 2
* FGFS-101, Flood Sensor
* FGFS-101-PLUS, Flood Sensor (Z-Wave Plus)
* FGK-101, Door/Window Sensor
* FGK-10x, Door/Window Sensor (Z-Wave Plus)
* FGMS-001, Motion Sensor
* FGMS-001-PLUS, Motion Sensor (Z-Wave Plus)
* FGS-211, Relay Switch
* FGS-212, Relay Switch 2
* FGS-221, Double Relay Switch
* FGS-222, Double Relay Switch 2

# Supported devices with some parameters:
* FGWPE-001, Wall Plug
* FGRM-222, Roller Shutter 2

# Supported devices without parameters:
* FGGC-001, Swipe
* FGRGVWM-441, RGBW Controller
* FGSD-002, Smoke Detector (Z-Wave Plus)
* FGSS-001, Smoke Sensor

# Supported Languages:
* English
* Dutch (Nederlands)

# NOTE:
When using any FGS (relay) switch modules, keep this in mind when creating flows:
If you want to use Relay 1 (S1/Q1) in the "IF" and "AND" columns use the Main Device.
If you want to use Relay 1 (S1/Q1) in the "THEN" columns, you can use either, Main Device, or Relay 1.
If you want to use Relay 2 (S2/Q2) you can use Relay 2 in all ("IF", "AND" and "THEN" columns.

# Change Log:
# v1.0.9
add support (incl. parameters):
FGRM-222

# v1.0.8
add support (incl. parameters):
FGS-211, FGS-212, FGS-221, FGS-222, FGFS-001-PLUS
add parameters (incl. dutch translation):
FGD-211, FGD-212, FGFS-001 (+ PLUS), FGK-001 (+ PLUS)

# v1.0.7
add support:
FGD-211, FGD-212
add dutch languages to existing parameters.
