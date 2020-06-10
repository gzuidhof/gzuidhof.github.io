// filters.ts

/** Converts given pixel data to grayscale, input is an RGBA pixel byte array. */
export function pixelsToGrayscale(pixelData: Uint8Array): Uint8Array {
    // Output pixel data
    const o = new Uint8Array(pixelData.length);
  
    for (let i=0; i<pixelData.length; i+=4) {
      const r: f64 = pixelData[i]; // Note: this converts the byte value to a float64, in standard JS this is not necessary.
      const g: f64 = pixelData[i+1];
      const b: f64 = pixelData[i+2];
  
      // We use CIE luminance for conversion to RGB, the human eye is much more receptive to green.
      const v: u8 = Math.round(0.2126*r + 0.7152*g + 0.0722*b) as u8;
      o[i] = o[i+1] = o[i+2] = v;
      o[3] = 255; // Alpha
    }
    return o;
};
