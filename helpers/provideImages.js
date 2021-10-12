function provideImages(req, res) {
  console.log(process.env.IMAGE_SOURCE_FOLDER);
  res.send("Okay");
}

module.exports = provideImages;