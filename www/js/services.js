'use strict';

angular.module('melody.services', [])

// .constant('baseUrl', 'http://localhost:3000/')
//   .constant('baseUrl', 'http://192.168.1.101:3000/')
    .constant('baseUrl', 'https://neven.cc:3443/')
  .factory('songFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {

    return {
      song: $resource(baseUrl + 'songs/:songId', null, null),
      comment: $resource(baseUrl + 'songs/:songId/comments?sort=-1', null, null)

    };

  }])

  .factory('artistFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {

    return $resource(baseUrl + 'artists/:artistId', null, null);

  }])

  .factory('userFactory', ['$resource', 'baseUrl', function ($resource, baseUrl) {

    return {
      user: $resource(baseUrl + "users/:id", null, {
        'update': {
          method: 'PUT'
        }
      }),
      favorite: $resource(
        baseUrl + "users/:id/favorites/:songID",
        {
          id: '@id',
          songID: '@songID'
        },
        {
          'update': {
            method: 'PUT'
          }
        }),
      register: $resource(baseUrl + 'users/register'),
      login: $resource(baseUrl + 'users/login'),
      logout: $resource(baseUrl + 'users/logout')
    };
  }])

  .factory('localStorage', ['$window', function ($window) {
    return {
      store: function (key, value) {
        $window.localStorage[key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      remove: function (key) {
        $window.localStorage.removeItem(key);
      },
      storeObject: function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key, defaultValue) {
        return JSON.parse($window.localStorage[key] || defaultValue);
      }
    }
  }])

  .factory('favFactory', ['$rootScope', 'localStorage', 'userFactory', function ($rootScope, localStorage, userFactory) {

    var favFactory = {};
    var favList = [];

    // item is songInfo object
    favFactory.updateFavoriteList = function (item) {
      console.log(item);
      var userID = localStorage.getObject('Token', '{}').userID;
      favList = localStorage.getObject(userID, '[]');

      if (favList.indexOf(item.id) === -1) {
        // if item is not in favList, add it
        favList.push(item.id);
        localStorage.storeObject(userID, favList);
        userFactory.favorite.update(
          {
            id: userID,
            songID: item.id
          },
          {})
          .$promise.then(function (response) {
          // console.log('Add to favList');
          // console.log(response);
        }, function (err) {
          console.log(err);
        });
        $rootScope.$broadcast('favoriteList: Update', {operation: 'add', song: item});
      } else {
        // remove item from favList
        favList.splice(favList.indexOf(item.id), 1);
        localStorage.storeObject(userID, favList);
        userFactory.favorite.remove(
          {
            id: userID,
            songID: item.id
          })
          .$promise.then(function (response) {
          // console.log('Remove from favList');
          // console.log(response);
        }, function (err) {
          console.log(err);
        });
        $rootScope.$broadcast('favoriteList: Update', {operation: 'remove', song: item});
      }

    };

    favFactory.removeAll = function () {

      var userID = localStorage.getObject('Token', '{}').userID;

      // clear all item in favList
      localStorage.storeObject(userID, '[]');
      userFactory.favorite.remove({id: userID})
        .$promise.then(function (response) {
        // console.log('Remove all from favList');
        // console.log(response);
      }, function (err) {
        console.log(err);
      });
      $rootScope.$broadcast('favoriteList: Update', {operation: 'removeAll'});
    };

    favFactory.isInFavList =function (item) {
      var userID = localStorage.getObject('Token', '{}').userID;
      favList = localStorage.getObject(userID, '[]');
      // console.log(userID);

      // console.log(favList.indexOf(item.id) !== -1);
      return favList.indexOf(item.id) !== -1;
    };

    favFactory.syncFavAttr = function (item, array) {
      angular.forEach(array, function (obj) {
        if (obj._id === item._id) {
          obj.favorite = !obj.favorite;
          return null;
        }
      });

      // console.log(index +' '+ item.favorite + ' ' + arr[index].favorite);
    };

    return favFactory;
  }])

  .factory('AuthFactory', ['$resource', '$http', 'localStorage', '$rootScope', '$window', 'userFactory', '$ionicPopup', function ($resource, $http, localStorage, $rootScope, $window, userFactory, $ionicPopup) {
    var authFac = {};
    var TOKEN_KEY ='Token';
    var isAuthenticated = false;
    var username = '';
    var authToken = undefined;
    var userInfo = localStorage.getObject('userinfo', '{}');

    loadUserCredentials();

    function useCredentials(credentials) {
      isAuthenticated = true;
      username = credentials.username;
      authToken = credentials.Token;
      // Set the token as header for your requests!
      $http.defaults.headers.common['x-access-token'] = authToken;
      storeFavlistToLocal();
    }

    function loadUserCredentials() {
      var credentials = localStorage.getObject(TOKEN_KEY, '{}');
      if (credentials.username != undefined) {
        useCredentials(credentials);
      }
    }

    function storeUserCredentials(credentials) {
      localStorage.storeObject(TOKEN_KEY, credentials);
      useCredentials(credentials);
    }

    function destroyUserCredentials() {
      authToken = undefined;
      username = '';
      isAuthenticated = false;
      $http.defaults.headers.common['x-access-token'] = authToken;
      localStorage.remove(TOKEN_KEY);
    }

    function storeFavlistToLocal() {

      var userID = localStorage.getObject('Token').userID;
      var favListOrder = localStorage.getObject(userID, '[]');

      userFactory.favorite.get({
        id: userID
      }).$promise.then(function (response) {
        // save favList order after drag & drop in a callback!! Not save to server,
        // only save in localStorage, and sync the order after get the response from server.
        if (favListOrder.length < response.favorites.length) {
          favListOrder = [];
          angular.forEach(response.favorites, function (item) {
            favListOrder.push(item.songInfo._id);
          });
          localStorage.storeObject(userID, favListOrder);
        }
      });
    }

    authFac.login = function (loginData) {

      userFactory.login
        .save(loginData, function (response) {
            storeUserCredentials({
              username: loginData.username,
              Token: response.token,
              userID: response.id,
              avatar: response.avatar
            });
            $rootScope.$broadcast('login: Successful');
          },
          function (response) {
            isAuthenticated = false;

            console.log(response.data);

            $ionicPopup.alert({
              title: 'Login Failed',
              template: '<p class="text-center">' + response.data.err.message + '</p>',
              buttons: [{
                text: 'Got it!',
                type: 'button-positive'
              }]
            });
          //   var message = '\
          //               <div class="ngdialog-message">\
          //                   <div><h4>Login Unsuccessful</h4></div>' +
          //     '<div><p>' + response.data.err.name + '</p></div>' +
          //     '<div class="ngdialog-buttons">\
          //         <button type="button" class="ngdialog-button ngdialog-button-primary" ng-click=confirm("OK")>OK</button>\
          //     </div>\
          // </div>';

            // ngDialog.openConfirm({ template: message, plain: 'true'});
          });
    };

    authFac.logout = function () {
      userFactory.logout.get(function (response) {});
      destroyUserCredentials();
      $rootScope.$broadcast('logout: Successful');
    };

    authFac.register = function (registerData) {

      userFactory.register
        .save(registerData, function (response) {
            authFac.login({username: registerData.username, password: registerData.password});
            if (registerData.rememberMe) {
              localStorage.storeObject('userinfo', {username: registerData.username, password: registerData.password});
            }
            $rootScope.$broadcast('registration: Successful');
          },
          function (response) {
            // var message = '\
            //             <div class="ngdialog-message">\
            //                 <div><h4>Registration Unsuccessful</h4></div>' +
            //   '<div><p>' + response.data.err.name + '</p></div></div>';

            // ngDialog.openConfirm({ template: message, plain: 'true'});
            console.log(response.data);
            $ionicPopup.alert({
              title: 'Registration Unsuccessful',
              template: '<p class="text-center">'+ response.data.err.message +'</p>',
              buttons: [{
                text: 'Got it!',
                type: 'button-positive'
              }]
            });
          });
    };

    authFac.isAuthenticated = function () {
      return isAuthenticated;
    };

    authFac.getUsername = function () {
      return username;
    };

    if (Object.keys(userInfo).length !== 0) {
      authFac.login(userInfo);
    }

    return authFac;
  }])

  // .factory('$ionicBottomSheet', [
  //   '$rootScope',
  //   '$compile',
  //   '$animate',
  //   '$timeout',
  //   '$ionicTemplateLoader',
  //   '$ionicPlatform',
  //   '$ionicBody',
  //   'IONIC_BACK_PRIORITY',
  //   function($rootScope, $compile, $animate, $timeout, $ionicTemplateLoader, $ionicPlatform, $ionicBody, IONIC_BACK_PRIORITY) {
  //
  //     return {
  //       show: actionSheet
  //     };
  //     function actionSheet(opts) {
  //       var scope = $rootScope.$new(true);
  //
  //       var  noop = angular.noop,
  //         jqLite = angular.element,
  //         extend = angular.extend;
  //
  //       // jqLite.prototype.addClass = function(cssClasses) {
  //       //   console.log('add class');
  //       //   var x, y, cssClass, el, splitClasses, existingClasses;
  //       //   if (cssClasses && cssClasses != 'ng-scope' && cssClasses != 'ng-isolate-scope') {
  //       //     for (x = 0; x < this.length; x++) {
  //       //       el = this[x];
  //       //       if (el.setAttribute) {
  //       //
  //       //         if (cssClasses.indexOf(' ') < 0 && el.classList.add) {
  //       //           el.classList.add(cssClasses);
  //       //         } else {
  //       //           existingClasses = (' ' + (el.getAttribute('class') || '') + ' ')
  //       //             .replace(/[\n\t]/g, " ");
  //       //           splitClasses = cssClasses.split(' ');
  //       //
  //       //           for (y = 0; y < splitClasses.length; y++) {
  //       //             cssClass = splitClasses[y].trim();
  //       //             if (existingClasses.indexOf(' ' + cssClass + ' ') === -1) {
  //       //               existingClasses += cssClass + ' ';
  //       //             }
  //       //           }
  //       //           el.setAttribute('class', existingClasses.trim());
  //       //         }
  //       //       }
  //       //     }
  //       //   }
  //       //   return this;
  //       // };
  //
  //       // jqLite.prototype.removeClass = function(cssClasses) {
  //       //   console.log('remove class');
  //       //   var x, y, splitClasses, cssClass, el;
  //       //   if (cssClasses) {
  //       //     for (x = 0; x < this.length; x++) {
  //       //       el = this[x];
  //       //       if (el.getAttribute) {
  //       //         if (cssClasses.indexOf(' ') < 0 && el.classList.remove) {
  //       //           el.classList.remove(cssClasses);
  //       //         } else {
  //       //           splitClasses = cssClasses.split(' ');
  //       //
  //       //           for (y = 0; y < splitClasses.length; y++) {
  //       //             cssClass = splitClasses[y];
  //       //             el.setAttribute('class', (
  //       //               (" " + (el.getAttribute('class') || '') + " ")
  //       //                 .replace(/[\n\t]/g, " ")
  //       //                 .replace(" " + cssClass.trim() + " ", " ")).trim()
  //       //             );
  //       //           }
  //       //         }
  //       //       }
  //       //     }
  //       //   }
  //       //   return this;
  //       // };
  //
  //       extend(scope, {
  //         cancel: noop,
  //         destructiveButtonClicked: noop,
  //         buttonClicked: noop,
  //         $deregisterBackButton: noop,
  //         buttons: [],
  //         cancelOnStateChange: true
  //       }, opts || {});
  //
  //       function textForIcon(text) {
  //         if (text && /icon/.test(text)) {
  //           scope.$actionSheetHasIcon = true;
  //         }
  //       }
  //
  //       for (var x = 0; x < scope.buttons.length; x++) {
  //         textForIcon(scope.buttons[x].text);
  //       }
  //       textForIcon(scope.cancelText);
  //       textForIcon(scope.destructiveText);
  //
  //       // Compile the template
  //       var element = scope.element = $compile('<ion-bottom-sheet ng-class="cssClass" buttons="buttons"></ion-bottom-sheet>')(scope);
  //
  //
  //       // Grab the sheet element for animation
  //
  //       // var sheetEl = jqLite(element[0].querySelector('.action-sheet-wrapper'));
  //
  //       // wait for the ajax of templateUrl
  //       var sheetEl;
  //
  //       $timeout(function () {
  //         sheetEl = jqLite(element[0].querySelector('.action-sheet-wrapper'));
  //       }, 20);
  //
  //       var stateChangeListenDone = scope.cancelOnStateChange ?
  //         $rootScope.$on('$stateChangeSuccess', function() { scope.cancel(); }) :
  //         noop;
  //
  //       // removes the actionSheet from the screen
  //       scope.removeSheet = function(done) {
  //         if (scope.removed) return;
  //
  //         scope.removed = true;
  //         sheetEl.removeClass('action-sheet-up');
  //         $timeout(function() {
  //           // wait to remove this due to a 300ms delay native
  //           // click which would trigging whatever was underneath this
  //           $ionicBody.removeClass('action-sheet-open');
  //         }, 400);
  //         scope.$deregisterBackButton();
  //         stateChangeListenDone();
  //
  //         $animate.removeClass(element, 'active').then(function() {
  //           scope.$destroy();
  //           element.remove();
  //           // scope.cancel.$scope is defined near the bottom
  //           scope.cancel.$scope = sheetEl = null;
  //           (done || noop)(opts.buttons);
  //         });
  //       };
  //
  //       scope.showSheet = function(done) {
  //         if (scope.removed) return;
  //
  //         $ionicBody.append(element)
  //           .addClass('action-sheet-open');
  //
  //         $animate.addClass(element, 'active').then(function() {
  //           if (scope.removed) return;
  //           (done || noop)();
  //         });
  //         $timeout(function() {
  //           if (scope.removed) return;
  //           sheetEl.addClass('action-sheet-up');
  //         }, 20, false);
  //       };
  //
  //       // registerBackButtonAction returns a callback to deregister the action
  //       scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(
  //         function() {
  //           $timeout(scope.cancel);
  //         },
  //         IONIC_BACK_PRIORITY.actionSheet
  //       );
  //
  //       // called when the user presses the cancel button
  //       scope.cancel = function() {
  //         // after the animation is out, call the cancel callback
  //         scope.removeSheet(opts.cancel);
  //       };
  //
  //       scope.buttonClicked = function(index) {
  //         // Check if the button click event returned true, which means
  //         // we can close the action sheet
  //         if (opts.buttonClicked(index, opts.buttons[index]) === true) {
  //           scope.removeSheet();
  //         }
  //       };
  //
  //       scope.destructiveButtonClicked = function() {
  //         // Check if the destructive button click event returned true, which means
  //         // we can close the action sheet
  //         if (opts.destructiveButtonClicked() === true) {
  //           scope.removeSheet();
  //         }
  //       };
  //
  //       scope.showSheet();
  //
  //       // Expose the scope on $ionicActionSheet's return value for the sake
  //       // of testing it.
  //       scope.cancel.$scope = scope;
  //
  //       return scope.cancel;
  //     }
  //   }])
;

