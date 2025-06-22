// Color storage methods
export function RGBtoHEX(r, g, b) {
	// Convert each RGB component to a two-digit hexadecimal value
	const hexR = r.toString(16).padStart(2, "0");
	const hexG = g.toString(16).padStart(2, "0");
	const hexB = b.toString(16).padStart(2, "0");

	// Combine the hexadecimal values to form the final color code
	const hexColor = `#${hexR}${hexG}${hexB}`;

	return hexColor;
}

export function HEXtoRGB(hex) {
	// Remove the '#' symbol
	hex = hex.substring(1, 7);

	// Split the hex string into three parts: red, green, and blue
	const red = parseInt(hex.substring(0, 2), 16);
	const green = parseInt(hex.substring(2, 4), 16);
	const blue = parseInt(hex.substring(4, 6), 16);

	// Return the RGB values as an object
	return [red, green, blue];
}