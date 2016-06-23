const Artwork = require('./Artwork');

class Video {
  constructor (videoObj, plexClient) {
    console.log(videoObj);
    this.addedAt = new Date (videoObj.addedAt * 1000);
    this.art = new Artwork (videoObj.art, plexClient);
    this.contentRating = videoObj.contentRating;
    this.duration = videoObj.duration;
    this.grandparent = {
      art: new Artwork (videoObj.grandparentArt, plexClient),
      key: videoObj.grandparentKey,
      theme: videoObj.grandparentTheme,
      thumb: new Artwork (videoObj.grandparentThumb, plexClient),
      title: videoObj.grandparentTitle,
    };
    this.guid = videoObj.guid;
    this.index = videoObj.index;
    this.key = videoObj.key;
    //this.lastViewedAt = new Date (videoObj.lastViewedAt * 1000);
    this.originallyAvailableAt = new Date (videoObj.originallyAvailableAt);
    this.parent = {
      index: videoObj.parentIndex,
      key: videoObj.parentKey,
      ratingKey: videoObj.parentRatingKey,
      thumb: new Artwork (videoObj.parentThumb, plexClient),
    };
    this.rating = parseFloat(videoObj.rating),
    this.ratingKey = parseInt(videoObj.ratingKey, 10),
    this.summary = videoObj.summary;
    this.thumb = new Artwork (videoObj.thumb, plexClient);
    this.title = videoObj.title;
    this.type = videoObj.type;
    this.updatedAt = new Date (videoObj.updatedAt * 1000);
    this.viewOffset = videoObj.viewOffset;
    this.year = parseInt(videoObj.year, 10);
  }
}

module.exports = Video;