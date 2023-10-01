class ListCard extends HTMLElement {

  col_map = {};
  feed = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    const cardConfig = Object.assign({}, config);
    const columns = cardConfig.columns;
    const card = document.createElement('ha-card');
    const content = document.createElement('div');
    const style = document.createElement('style');
    style.textContent = `
          ha-card {
            /* sample css */
          }
          .entry {
            padding: 4px;
            margin-bottom: 10px;
            overflow: auto;
          }
          .title {
            padding: 4px;
            font-size: 12pt;
            font-weight: 500;
          }
          img {
            width: 150px;
            padding: 3px;
            float: left;
          }
        `;

    // Go through columns and add CSS sytling to each column that is defined
    if (columns) {
      for (let column in columns) {
        if (columns.hasOwnProperty(column) && columns[column].hasOwnProperty('style')) {
          let styles = columns[column]['style'];

          style.textContent += `
            .${columns[column].field} {`

          for (let index in styles) {
            if (styles.hasOwnProperty(index)) {
              for (let s in styles[index]) {
                style.textContent += `
                ${s}: ${styles[index][s]};`;
              }
            }
          }

          style.textContent += `}`;
        }
      }
    }

    content.id = "container";
    cardConfig.title ? card.header = cardConfig.title : null;
    card.appendChild(content);
    card.appendChild(style);
    root.appendChild(card);
    this._config = cardConfig;
  }

  hasValidEntry(index, field) {
    return (
      this.col_map.hasOwnProperty(field) && this.feed[index].hasOwnProperty(this.col_map[field].field)
    );
  }

  getFeedItemText(index, field) {
    if (!this.col_map.hasOwnProperty(field)) {
      return `(missing column type ${field} in configuration)`;
    }

    var item = this.feed[index];
    var column = this.col_map[field];

    if (!item.hasOwnProperty(column.field)) {
      return `(missing field ${column.field} in feed)`;
    }

    if (column.hasOwnProperty("add_link")) {
      if (item.hasOwnProperty(column.add_link)) {
        var link_href = item[column.add_link];
        return `<a href="${link_href}" target="_blank">${item[column.field]}</a>`
      }
    }

    if (column.hasOwnProperty("regex")) {
      var newText = new RegExp(column.regex, "gs").exec(item[column.field]);
      if (newText != null && newText.length > 0) {
        return newText[0];
      }
    }

    return item[column.field];
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;
    const card = root.lastChild;

    if (hass.states[config.entity]) {
      this.feed = config.feed_attribute ? hass.states[config.entity].attributes[config.feed_attribute] : hass.states[config.entity].attributes;
      const columns = config.columns;
      this.style.display = 'block';
      const rowLimit = config.row_limit ? config.row_limit : Object.keys(feed).length;
      let rows = 0;

      console.log("NewsCard v.0.0.2");
      console.log(
        hass.states[config.entity].attributes['friendly_name']
      );

      this.col_map = {};
      for (let c in columns) {
        this.col_map[columns[c].type] = columns[c];
      }

      if (this.feed !== undefined && Object.keys(this.feed).length > 0) {
        let card_content = '<div class="news-card-news">';

        console.log(this.col_map);

        for (let item in this.feed)
        {
          if (rows++ >= rowLimit) break;

          let entry = '<div class="entry">';

          // title
          entry += `<div class="title">${this.getFeedItemText(item, "title")}</div>`;

          // summary
          entry += '<div class="summary">'
          // image
          if (this.hasValidEntry(item, "image"))
            entry += `<img src="${this.getFeedItemText(item, "image")}" />`;
          // text
          entry += this.getFeedItemText(item, "summary");
          entry += '</div>'

          entry += '</div>'
          card_content += entry;
        }

        root.lastChild.hass = hass;
        card_content += `</div>`;
        root.getElementById('container').innerHTML = card_content;
      } else {
        this.style.display = 'none';
      }
    } else {
      this.style.display = 'none';
    }
  }

  getCardSize() {
    return 1;
  }
}

  customElements.define('list-card', ListCard);
