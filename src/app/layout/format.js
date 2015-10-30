//  Copyright (C) 2011 Matsukei Co.,Ltd.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

goog.provide('thin.layout.Format');

goog.require('goog.json');
goog.require('goog.Disposable');
goog.require('thin.layout.FormatPage');
goog.require('thin.Version');
goog.require('thin.Compatibility');


/**
 * @param {Object=} opt_format
 * @constructor
 * @extends {goog.Disposable}
 */
thin.layout.Format = function(opt_format) {
  goog.base(this);

  this.state_ = {};
  var currentVersion = thin.getVersion();
  
  if (goog.isDefAndNotNull(opt_format) && goog.isObject(opt_format)) {
    this.setSvg(opt_format['objects']);
    this.page = this.setPage(opt_format['report']);
    this.page.setTitle(opt_format['title']);

    var formatVersion = opt_format['version'];
    var state = opt_format['state'];
    var guides;

    this.isOverWritableVersion_ = thin.Compatibility.check(currentVersion, '>', formatVersion);
    this.version_ = formatVersion;

    if (state && (guides = state['layout-guide'])) {
      this.setLayoutGuides(guides);
    }
  } else {
    this.version_ = currentVersion;
  }
};
goog.inherits(thin.layout.Format, goog.Disposable);


/**
 * @type {thin.layout.FormatPage}
 */
thin.layout.Format.prototype.page;


/**
 * @type {string}
 * @private
 */
thin.layout.Format.prototype.version_;


/**
 * @type {boolean}
 * @private
 */
thin.layout.Format.prototype.isOverWritableVersion_ = false;


/**
 * @type {string}
 * @private
 */
thin.layout.Format.prototype.svg_;


/**
 * @type {Object}
 * @private
 */
thin.layout.Format.prototype.state_;


/**
 * @param {string} content
 * @return {thin.layout.Format}
 */
thin.layout.Format.parse = function(content) {
  var hash = JSON.parse(content);
  var version = hash['version'];

  thin.Compatibility.applyIf(version, '<', '1.0.0', function() {
    var config = goog.object.clone(hash['config']);

    goog.object.set(hash, 'title', config['title']);

    var margin = [];
    goog.array.insert(margin, config['margin-top']);
    goog.array.insert(margin, config['margin-right']);
    goog.array.insert(margin, config['margin-bottom']);
    goog.array.insert(margin, config['margin-left']);

    goog.object.remove(hash, 'config');
    goog.object.remove(config, 'title');
    goog.object.remove(config, 'margin-top');
    goog.object.remove(config, 'margin-right');
    goog.object.remove(config, 'margin-bottom');
    goog.object.remove(config, 'margin-left');

    goog.object.set(config, 'margin', margin);
    goog.object.set(hash, 'report', config);
    goog.object.set(hash, 'objects', hash['svg']);

    goog.object.remove(hash, 'svg');
  });

  return new thin.layout.Format(hash);
};


/**
 * @return {string}
 */
thin.layout.Format.prototype.toJSON = function() {
  if (this.isOverWritableVersion_) {
    this.version_ = thin.getVersion();
  }

  var hash = {
    "version": this.version_,
    "objects": this.svg_,
    "state": {
      "layout-guide": this.getLayoutGuides()
    }
  };
  goog.object.extend(hash, this.page.toHash());

  return goog.json.serialize(hash);
};


/**
 * @return {string}
 */
thin.layout.Format.prototype.getSvg = function() {
  return this.svg_;
};


/**
 * @return {Array}
 */
thin.layout.Format.prototype.getLayoutGuides = function() {
  return this.state_['layout-guide'] || [];
};


/**
 * @param {string} version
 */
thin.layout.Format.prototype.setVersion = function(version) {
  this.version_ = version;
};


/**
 * @return {string}
 */
thin.layout.Format.prototype.getVersion = function() {
  return this.version_;
};


/**
 * @param {Array} guides
 */
thin.layout.Format.prototype.setLayoutGuides = function(guides) {
  this.state_['layout-guide'] = guides;
};


/**
 * @param {Object} svg
 */
thin.layout.Format.prototype.setSvg = function(svg) {
  this.svg_ = svg;
};


/**
 * @param {Object} config
 * @return {thin.layout.FormatPage}
 */
thin.layout.Format.prototype.setPage = function(config) {
  return new thin.layout.FormatPage(config);
};


/** inheritDoc */
thin.layout.Format.prototype.disposeInternal = function() {
  thin.layout.Format.superClass_.disposeInternal.call(this);
  
  this.page.dispose();
  delete this.page;
};