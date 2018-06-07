(function() {

  var store = function store(key, value) {
    var lsSupport = false;

    // Check for native support
    if (localStorage) {
      lsSupport = true;
    }

    // If value is detected, set new or modify store
    if (typeof value !== "undefined" && value !== null) {
      // Convert object values to JSON
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      // Set the store
      if (lsSupport) { // Native support
        localStorage.setItem(key, value);
      } else { // Use Cookie
        createCookie(key, value, 30);
      }
    }

    // No value supplied, return value
    if (typeof value === "undefined") {
      // Get value
      if (lsSupport) { // Native support
        data = localStorage.getItem(key);
      } else { // Use cookie
        data = readCookie(key);
      }

      // Try to parse JSON...
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = data;
      }

      return data;

    }

    // Null specified, remove store
    if (value === null) {
      if (lsSupport) { // Native support
        localStorage.removeItem(key);
      } else { // Use cookie
        createCookie(key, '', -1);
      }
    }

    /**
     * Creates new cookie or removes cookie with negative expiration
     * @param  key       The key or identifier for the store
     * @param  value     Contents of the store
     * @param  exp       Expiration - creation defaults to 30 days
     */

     function createCookie(key, value, exp) {
      var date = new Date();
      date.setTime(date.getTime() + (exp * 24 * 60 * 60 * 1000));
      var expires = "; expires=" + date.toGMTString();
      document.cookie = key + "=" + value + expires + "; path=/";
    }

    /**
     * Returns contents of cookie
     * @param  key       The key or identifier for the store
     */

     function readCookie(key) {
      var nameEQ = key + "=";
      var ca = document.cookie.split(';');
      for (var i = 0, max = ca.length; i < max; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }

  };

  var chat = {
    messageToSend: '',
    init: function() {
      this.cacheDOM();
      this.getUserId();
      this.bindEvents();
      this.render();
    },
    cacheDOM: function() {
      this.$chatHistory = $('.chat-history');
      this.$button = $('button');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList = this.$chatHistory.find('ul');
    },
    getUserId: function() {
      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }
      this.$ref = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
      if (store('hlp')) {
        // have cookie
        this.$ref = store('hlp');
        console.log(`read cookie ${this.$ref}`)
      } else {
        // no cookie
        store('hlp', this.$ref);
        console.log(`created cookie ${this.$ref}`)
      }
    },
    bindEvents: function() {
      this.$button.on('click', this.addMessage.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
    },
    render: function() {
      this.scrollToBottom();
      if (this.messageToSend.trim() !== '') {
        var template = Handlebars.compile($("#message-template").html());
        var context = {
          messageOutput: this.messageToSend,
          time: this.getCurrentTime()
        };

        this.$chatHistoryList.append(template(context));
        this.scrollToBottom();
        this.$textarea.val('');

        setTimeout(function() {
          this.askHelloLampPost(this.messageToSend);
        }.bind(this), 1500);
      }
    },
    addMessage: function() {
      this.messageToSend = this.$textarea.val()
      this.render();
    },
    addMessageEnter: function(event) {
      // enter was pressed
      if (event.keyCode === 13) {
        this.addMessage();
      }
    },
    scrollToBottom: function() {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
    getCurrentTime: function() {
      return new Date().toLocaleTimeString().
      replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    },
    displayTyping: function(message) {
      var contextResponse = {
        time: this.getCurrentTime()
      };
      var templateResponse = Handlebars.compile($("#typing-template").html());
      var templated = templateResponse(contextResponse);
      this.$chatHistoryList.append(templated);
      this.scrollToBottom();
    },
    displayReply: function(message) {
      // remove typing li if found
      $('#typing').remove();
      var contextResponse = {
        response: message,
        time: this.getCurrentTime()
      };
      var templateResponse = Handlebars.compile($("#message-response-template").html());
      var templated = templateResponse(contextResponse);
      this.$chatHistoryList.append(templated);
      this.scrollToBottom();
    },
    askHelloLampPost: function(message) {
      var d = {
        entry: [{
          messaging: [{
            sender: {
              id: this.$ref
            },
            recipient: {
              id: 222
            },
            message: {
              text: message
            }
          }]
        }]
      };
      var data = JSON.stringify(d);
      var request = new XMLHttpRequest();
      request.open('POST', 'http://0.0.0.0:3000/telephony/handle_sms', true);
      request.setRequestHeader('Content-Type', 'application/json');
      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
          chat.displayReply(request.responseText);
        }
      }
      request.send(data);
      chat.displayTyping();
    }
  };

  chat.init();

  var searchFilter = {
    options: {
      valueNames: ['name']
    },
    init: function() {
      var userList = new List('people-list', this.options);
      var noItems = $('<li id="no-items-found">No items found</li>');

      userList.on('updated', function(list) {
        if (list.matchingItems.length === 0) {
          $(list.list).append(noItems);
        } else {
          noItems.detach();
        }
      });
    }
  };

  searchFilter.init();

})();