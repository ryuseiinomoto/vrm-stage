// Joins numbered PNG frames into a looping GIF with the system's own image library:
//   swift tools/gif.swift <framesDir> <out.gif> <secondsPerFrame>
import Foundation
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count == 4, let delay = Double(a[3]) else {
  print("usage: gif.swift <framesDir> <out.gif> <secondsPerFrame>")
  exit(1)
}
let dir = URL(fileURLWithPath: a[1])
let names = try FileManager.default.contentsOfDirectory(atPath: a[1]).filter { $0.hasSuffix(".png") }.sorted()
guard !names.isEmpty, let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.gif.identifier as CFString, names.count, nil) else {
  print("no frames, or cannot write the file")
  exit(1)
}
CGImageDestinationSetProperties(dest, [kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]] as CFDictionary)
let frame = [kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFDelayTime: delay, kCGImagePropertyGIFUnclampedDelayTime: delay]] as CFDictionary
for n in names {
  guard let src = CGImageSourceCreateWithURL(dir.appendingPathComponent(n) as CFURL, nil), let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
  CGImageDestinationAddImage(dest, img, frame)
}
print(CGImageDestinationFinalize(dest) ? "wrote \(a[2]) from \(names.count) frames" : "failed")
