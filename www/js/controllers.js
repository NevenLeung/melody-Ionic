'use strict';

angular.module('melody.controllers', [])

  .controller('PlayerCtrl', ['$scope', 'angularPlayer', '$timeout', '$rootScope', 'songFactory', 'favFactory', 'AuthFactory','baseUrl', '$ionicBottomSheet', '$ionicModal','localStorage', '$ionicHistory', '$state', function ($scope, angularPlayer, $timeout, $rootScope, songFactory, favFactory, AuthFactory, baseUrl, $ionicBottomSheet, $ionicModal, localStorage, $ionicHistory, $state) {

    // the sidebar menu controller

    $scope.baseUrl = baseUrl;

    $scope.isLoggedIn= AuthFactory.isAuthenticated();

    loadUserInfo();

    // $scope.openRegisterModal = function () {
    //   $ionicModal.fromTemplateUrl('templates/register-page.html', {
    //     scope: null,
    //     animation: 'slide-in-up'
    //   }).then(function(modal) {
    //     // this $scope is modal isolated scope
    //     $scope.registerModal = modal;
    //   });
    //
    // };

    $ionicModal.fromTemplateUrl('templates/login-page.html', {
      scope: null,
      animation: 'slide-in-up'
    }).then(function(modal) {
      // this $scope is modal isolated scope
      $scope.loginModal = modal;
    });

    $scope.openLoginModal = function () {
      $scope.loginModal.show();
    };

    $scope.doLogout = function () {
      $scope.isLoggedIn = false;
      AuthFactory.logout();
      // $scope.userName = '';
    };

    $rootScope.$on('login: Successful', function () {
      loadUserInfo();
      $scope.isLoggedIn = true;
    });

    $rootScope.$on('logout: Successful', function () {
      $ionicHistory.nextViewOptions({
        historyRoot: true
      });
      $state.go('app.home');
    });

    $scope.stateIs = function(currentState) {
      return $state.is(currentState);
    };

    // $scope.avatarList = ['001.jpg', '002.jpg', '003.jpg', '004.jpg', '005.jpg'];

    function loadUserInfo() {
      $scope.username = localStorage.getObject('Token', '{}').username;
      $scope.avatar = baseUrl + 'images/avatar/' + localStorage.getObject('Token', '{}').avatar;
      $scope.userID = localStorage.getObject('Token', '{}').userID;
    }

    // the player controller

    // $scope.showVolumeSlider = false;

    // $scope.showTips = true;

    // $scope.showTips = true;
    //
    // $timeout(function () {
    //   $scope.showTips = false;
    // }, 3000);

    refreshPlaylist();

    // For the play pause toggle button
    $scope.playIcon = '<i class="icon icon-big ion-play salmon"></i>';
    $scope.pauseIcon = '<i class="icon icon-big ion-pause salmon"></i>';

    $scope.showVolumeSlider = false;

    $ionicModal.fromTemplateUrl('templates/playlist.html', {
      scope: null,
      animation: 'slide-in-up'
    }).then(function(modal) {
      // this $scope is modal isolated scope
      $scope.playlistModal = modal;
      // console.log(modal);
      // console.log($scope);
    });

    $scope.openPlaylistModal = function(){
      console.log('modal show');
      $scope.playlistModal.show();
    };

    $scope.closePlaylistModal = function(){
      console.log('modal hide');
      $scope.playlistModal.hide();
    };

    // the volume slider control
    // $scope.sliderOptions = {
    //   from: 100,
    //   to: 0,
    //   step: 10,
    //   vertical: true,
    //   callback: function (value) {
    //     // To adjust the volume
    //     angularPlayer.adjustVolumeSlider(value);
    //     // $scope.volume = value;
    //   }
    // };

    $scope.volumeSlider = function (value) {
      angularPlayer.adjustVolumeSlider(value);
    };

    // $scope.volumeSliderToggle = function () {
    //   console.log('toggle');
    //   console.log($scope.showVolumeSlider);
    //
    //   // $scope.showVolumeSlider = true;
    //   $scope.showVolumeSlider = !$scope.showVolumeSlider;
    // };

    $scope.playPauseToggle = function () {
      $rootScope.$emit('play&pause: toggle');
      // console.log($scope);
      console.log($scope.currentPlaying);
    };

    // $scope.toggleFavorite = function (item) {
    //   if (AuthFactory.isAuthenticated()) {
    //     // only user who logged in can execute this operation
    //     favFactory.updateFavoriteList(item);
    //     item.favorite = favFactory.isInFavList(item);
    //   } else {
    //     $ionicPopup.alert({
    //       title: 'Reminder',
    //       template: '<p class="text-center">Hey! You need to log in to go on this operation.</p>'
    //     });
    //   }
    // };

    // go back to app.home state
    $scope.backToHome = function () {
      $ionicHistory.nextViewOptions({
        historyRoot: true
      });
      $state.go('app.home');
    };

    $rootScope.$on('favoriteList: Update', function (event, data) {
      if (data.operation == 'removeAll') {
        angular.forEach($scope.playlist, function (item) {
          item.favorite = false;
        })
      }
    });

    // $scope.displayCurrentPlaying = function () {
    //     console.log($scope.currentPlaying);
    //     console.log(favFactory.isInFavList($scope.currentPlaying));
    // };

    $scope.spinIcon = function () {
      angularPlayer.stop();
      angularPlayer.setCurrentTrack(null);
      // clearPlaylist method needs a callback
      angularPlayer.clearPlaylist(function () {
        // console.log('Playlist is clear.');
      });

      $timeout(refreshPlaylist, 200);
      $scope.spinner = true;
      $timeout(function () {
        $scope.spinner = false
      }, 1000);
    };

    // $scope.showPlaylist = function () {
    //   customizedActionSheet.showUpSheet({
    //     template: 'templates/playlist.html'
    //   });
    //
    //   $timeout(function () {
    //     customizedActionSheet.hideUpSheet();
    //   }, 2000);
    // };

    $scope.swipeRight = function () {
      // console.log('left');
      angularPlayer.prevTrack()
    };

    $scope.swipeLeft = function () {
      // console.log('right');
      angularPlayer.nextTrack()
    };

    $scope.showPlaylist = function () {
      $ionicBottomSheet.show({});
    };

    // use the angular sound manager built-in event, which means clear playlist action has been executed
    // change the current playing info display flag
    // if none of song is in playlist, do not display the song info above the progress bar
    $rootScope.$on('player:playlist', function (event, data) {
      $scope.displayInfo = data.length !== 0;
    });

    $rootScope.$on('login: Successful', setFavorite);

    $rootScope.$on('logout: Successful', resetFavorite);

    function random(n) {
      return Math.floor(Math.random() * n);
    }

    function refreshPlaylist() {
      songFactory.song.get({},
        function (response) {
          // To generate 5 random songs from database
          var unique = {};
          for(var i = 0; Object.keys(unique).length < 5; i++) {
            // To make the song unique
            unique[JSON.stringify(response.data[random(response.total)])] = i;
          }
          $scope.songs = Object.keys(unique).map(function (str) {
            return JSON.parse(str);
          });

          // To add the songs to playlist
          angular.forEach($scope.songs, function (item) {
            item.id = item._id;
            item.url = baseUrl + 'music/' + item.url;
            item.albumCover =  baseUrl + 'images/album/' + item.albumCover;
            // if user is logged in, set his/her favorite to song info object
            item.favorite = favFactory.isInFavList(item);
            angularPlayer.addTrack(item);
          });
          angularPlayer.play();
          $scope.currentPlaying = angularPlayer.currentTrackData();

          // angularPlayer.pause();
          angularPlayer.play();

          // use the angular sound manager built-in event, which means a new song begin to play
          $rootScope.$broadcast('track:id');

          // the current playing info display flag
          $scope.displayInfo = true;
        },
        function (err) {
          console.log(err);
        }
      );
    }

    function setFavorite() {
      angular.forEach(angularPlayer.getPlaylist(), function (item) {
        item.favorite = favFactory.isInFavList(item);
        // console.log('1');
      });
      // console.log('set');
    }

    function resetFavorite() {
      angular.forEach(angularPlayer.getPlaylist(), function (item) {
        item.favorite = false;
      });
      // console.log('reset');
    }

  }])

  .controller('PlaylistCtrl', function ($rootScope, $scope, angularPlayer, $timeout, AuthFactory, favFactory, $ionicPopup) {

    $timeout(syncStatus, 100);

    $scope.toggleFavorite = function (item) {
      if (AuthFactory.isAuthenticated()) {
        // only user who logged in can execute this operation
        favFactory.updateFavoriteList(item);
        item.favorite = favFactory.isInFavList(item);
      } else {
        $ionicPopup.alert({
          title: 'Reminder',
          template: '<p class="text-center">Hey! You need to log in to go on this operation.</p>',
          buttons: [{
            text: 'Got it!',
            type: 'button-positive'
          }]
        });
      }
    };

    $rootScope.$on('track:id', function () {
      $timeout(syncStatus, 50);
    });

    $rootScope.$on('play&pause: toggle', function () {
      $scope.isPlay = angularPlayer.isPlayingStatus();
    });

    $rootScope.$on('Favorite: remove one', function (event, data) {
      // console.log(data);
      favFactory.syncFavAttr(data, $scope.playlist);
    });

    function syncStatus() {
      $scope.playlist = angularPlayer.getPlaylist();
      $scope.playing = angularPlayer.currentTrackData();
      $scope.isPlay = angularPlayer.isPlayingStatus();
    }
  })

  .controller('HeaderCtrl', ['$scope', '$state', '$rootScope', 'baseUrl', 'localStorage', 'AuthFactory', function ($scope, $state, $rootScope, baseUrl, localStorage, AuthFactory) {

    $scope.baseUrl = baseUrl;

    $scope.isLoggedIn= AuthFactory.isAuthenticated();

    loadUserInfo();

    $scope.openRegisterModal = function () {
      // ngDialog.open({
      //   template: 'views/register.html',
      //   scope: $scope,
      //   className: 'ngdialog-theme-default',
      //   controller:"RegisterCtrl"
      // });
    };

    $scope.openLoginModal = function () {
      // ngDialog.open({
      //   template: 'views/login.html',
      //   scope: $scope,
      //   className: 'ngdialog-theme-default',
      //   controller:"LoginCtrl"
      // });
    };

    $scope.doLogout = function () {
      $scope.isLoggedIn = false;
      AuthFactory.logout();
      // $scope.userName = '';
    };

    $rootScope.$on('login: Successful', function () {
      loadUserInfo();
      $scope.isLoggedIn = true;
    });

    $rootScope.$on('logout: Successful', function () {
      $state.go('app');
    });

    $scope.stateIs = function(currentState) {
      return $state.is(currentState);
    };

    $scope.avatarList = ['001.jpg', '002.jpg', '003.jpg', '004.jpg', '005.jpg'];

    function loadUserInfo() {
      $scope.username = localStorage.getObject('Token', '{}').username;
      $scope.avatar = baseUrl + 'images/avatar/' + localStorage.getObject('Token', '{}').avatar;
      $scope.userID = localStorage.getObject('Token', '{}').userID;
    }
  }])

  .controller('LoginCtrl', ['$scope', '$rootScope', 'AuthFactory', 'localStorage', '$ionicModal', function ($scope, $rootScope, AuthFactory, localStorage, $ionicModal) {

    $scope.loginData = localStorage.getObject('userinfo', '{}');

    $scope.doLogin = function () {
      if ($scope.rememberMe) {
        localStorage.storeObject('userinfo', $scope.loginData);
      }

      AuthFactory.login($scope.loginData);
    };

    $ionicModal.fromTemplateUrl('templates/register-page.html', {
      scope: null,
      animation: 'slide-in-up'
    }).then(function(modal) {
      // this $scope is modal isolated scope
      $scope.registerModal = modal;
    });

    $scope.openRegisterModal = function () {
      $scope.modal.hide();
      $scope.registerModal.show();
    };

    $rootScope.$on('login: Successful', function () {
      $scope.modal.hide();
    })
  }])

  .controller('RegisterCtrl', ['$scope', '$rootScope', 'AuthFactory', '$ionicPopup', 'baseUrl', function ($scope, $rootScope, AuthFactory, $ionicPopup, baseUrl) {

    $scope.registration = {};
    $scope.loginData = {};
    $scope.baseUrl = baseUrl;
    $scope.avatarList = ['001.jpg', '002.jpg', '003.jpg', '004.jpg', '005.jpg'];

    $scope.selectAvatar = function () {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Select one as your avatar',
        // template: 'Are you sure you want to eat this ice cream?'
        templateUrl:'templates/avatar-select.html',
        scope: $scope
      });

      confirmPopup.then(function(res) {
        if(res) {
          // console.log('You are sure');
        } else {
          // console.log('You are not sure');
        }
      });
    };

    $scope.doRegistration = function () {
      if ($scope.registration.avatar == undefined) {
        $scope.registration.avatar = '001.jpg';
      }
      console.log($scope.registration);
      AuthFactory.register($scope.registration);
      // $scope.modal.hide();
    };

    $rootScope.$on('registration: Successful', function () {
      $scope.modal.hide();
    })
  }])

  .controller('HomeCtrl', ['$scope', 'angularPlayer', '$rootScope', '$timeout', 'baseUrl', 'AuthFactory', 'favFactory' , '$ionicPopup', function ($scope, angularPlayer, $rootScope, $timeout, baseUrl, AuthFactory, favFactory, $ionicPopup) {

    $scope.baseUrl = baseUrl;

    $scope.showVolumeSlider = false;

    $scope.showTips = true;

    $timeout(function () {
      $scope.showTips = false;
    }, 8000);

    $scope.volumeSliderToggle = function () {
      // console.log('toggle');
      // console.log($scope.showVolumeSlider);

      // $scope.showVolumeSlider = true;
      $scope.showVolumeSlider = !$scope.showVolumeSlider;
    };
    // $scope.musicName = 'SHIROBAKO insert music';
    // $scope.albumName = 'Unknow';
    // $scope.albumPhoto = "images/album/shirobako.jpg";
    // $scope.singerName = 'Unknow';

    $scope.toggleFavorite = function (item) {
      if (AuthFactory.isAuthenticated()) {
        // only user who logged in can execute this operation
        favFactory.updateFavoriteList(item);
        item.favorite = favFactory.isInFavList(item);
      } else {
        $ionicPopup.alert({
          title: 'Reminder',
          template: '<p class="text-center">Hey! You need to log in to go on this operation.</p>',
          buttons: [{
            text: 'Got it!',
            type: 'button-positive'
          }]
        });
      }
    };

    updateHomeInfo();

    // listen the song change, including prev and next button
    $rootScope.$on('track:id', function (event, data) {
      // console.log(data);
      updateHomeInfo();
    });

    $rootScope.$on('track:progress', function (event, data) {
      // console.log(data);
      if (parseInt(data) === 100) {
        updateHomeInfo();
      }
    });

    function updateHomeInfo() {
      // use $timeout to obtain the data from angularPlayer.currentTrackData() a little later
      $timeout(function () {
        $scope.songID = angularPlayer.currentTrackData()._id;
        $scope.musicName = angularPlayer.currentTrackData().title;
        $scope.albumName = angularPlayer.currentTrackData().albumName;
        $scope.albumCover = $scope.baseUrl + 'images/album/' + angularPlayer.currentTrackData().albumCover;
        $scope.singerName = angularPlayer.currentTrackData().artist;
        $scope.singerID = angularPlayer.currentTrackData().artistID;
      }, 100)
    }
  }])

  .controller('SongCtrl', ['$scope', '$stateParams', 'angularPlayer', 'songFactory', 'AuthFactory', 'baseUrl', '$http', '$q', '$timeout', '$ionicPopup', function ($scope, $stateParams, angularPlayer, songFactory, AuthFactory, baseUrl, $http, $q, $timeout, $ionicPopup) {

    // $scope.numberOfItemsToDisplay = 5; // number of item to load each time
    // $scope.items = getData();
    //
    // function getData() {
    //   var a = [];
    //   for (var i=1; i< 1000; i++) {
    //     a.push(i);
    //   }
    //   // console.log(a);
    //   return a;
    // }
    //
    // $scope.addMoreItem = function() {
    //   console.log('load more');
    //   if ($scope.items.length > $scope.numberOfItemsToDisplay) {
    //     $scope.numberOfItemsToDisplay += 5; // load 20 more items
    //     // done(); // need to call this when finish loading more data
    //   }
    //   $scope.$broadcast('scroll.infiniteScrollComplete');
    //   // $scope.$apply(function(){
    //   //   $scope.$broadcast('scroll.infiniteScrollComplete');
    //   // });
    // };

    $scope.baseUrl = baseUrl;
    $scope.comments = [];

    // $scope.commentContent = 'click to comment!';

    $scope.noMoreItem = false;
    $scope.currentPage = 0;
    $scope.numberOfItemsToDisplay = 0;

    $scope.itemsPerPage = 5;

    // $scope.maxSize = 5;

    $scope.loadMore = function () {
      $scope.currentPage ++;
      $scope.pageChange();
      $scope.numberOfItemsToDisplay += 5;
    };

    $scope.$on('$stateChangeSuccess', function() {
      // $scope.loadMore();
      // $scope.pageChange();
    });

    $scope.checkComment = function () {
      if (!AuthFactory.isAuthenticated()) {
        // ngDialog.open({
        //   template: 'views/loginReminder.html',
        //   className: 'ngdialog-theme-default'
        // });
        $ionicPopup.alert({
          title: 'Reminder',
          template: '<p class="text-center">Hey! You need to log in to go on this operation.</p>',
          buttons: [{
            text: 'Got it!',
            type: 'button-positive'
          }]
        });
        $scope.commentContent = '';
        return;
      }
      if ($scope.commentContent.length == 0) {
        return;
      }
      $scope.submitComment();
    };

    // save the comment to database and set the pager to page number of newest comment
    $scope.submitComment = function () {
      // console.log('submit comment!');
      // $scope.currentPage = Math.ceil($scope.totalItems/$scope.itemsPerPage);
      // $scope.checkComment();
      console.log('submit comment!');
      songFactory.comment.save(
        {
          songId: $stateParams.id
        },
        {
          comment: $scope.commentContent
        },
        function (response) {
          // console.log(response);
        },
        function (err) {
          console.log(err);
        }
      );
      $scope.comments = [];
      $scope.currentPage = 1;
      $scope.numberOfItemsToDisplay = 5;
      $scope.pageChange();
      $scope.noMoreItem = false;
      $scope.commentContent = '';
    };

    // use mongoose-paginate to implement the pagination
    $scope.pageChange = function () {
      songFactory.comment.get(
        {
          songId: $stateParams.id,
          page:$scope.currentPage
        })
        .$promise.then(
        function (response) {
          console.log(response);
          if (response.docs.length === 0){
            $scope.noMoreItem = true;
          }
          angular.forEach(response.docs, function (item) {
            item.postedBy.avatar = baseUrl + 'images/avatar/' + item.postedBy.avatar;
            $scope.comments.push(item);
          });
          // $scope.totalItems = response.total;
          $scope.$broadcast('scroll.infiniteScrollComplete');

        },
        function (err) {
          console.log(err);
          $scope.$broadcast('scroll.infiniteScrollComplete');

        }
      );
    };

    function updateSongInfo() {
      $scope.songID = angularPlayer.currentTrackData()._id;

      $scope.musicName = angularPlayer.currentTrackData().title;
      $scope.albumName = angularPlayer.currentTrackData().albumName;
      $scope.albumCover = angularPlayer.currentTrackData().albumCover;
      $scope.singerName = angularPlayer.currentTrackData().artist;
      $scope.singerID = angularPlayer.currentTrackData().artistID;

      // $timeout(function () {
      //   Grade(document.querySelectorAll('.gradient-wrap'));
      // }, 500);
    }

    updateSongInfo();
    // $scope.getTotal();

    // use a promise to make sure to get num of comments, and set the pager to the last
    // var d = $q.defer();
    // $http.get(baseUrl+'songs/' + $stateParams.id + '/comments' , {page:$scope.currentPage})
    //   .then(
    //     function(res) {
    //       $scope.totalItems = res.data.total;
    //       $scope.currentPage = Math.ceil($scope.totalItems/$scope.itemsPerPage);
    //       $scope.pageChange();
    //       d.resolve();
    //     }, function(err){
    //       d.reject('error');
    //     });

  }])

  .controller('PersonalCtrl', ['$scope', '$state', '$timeout', '$rootScope', 'baseUrl', 'localStorage', 'userFactory', 'favFactory', '$q', '$http', 'AuthFactory', 'angularPlayer', '$ionicHistory', '$ionicPopup', '$ionicModal', function ($scope, $state, $timeout, $rootScope, baseUrl, localStorage, userFactory, favFactory, $q, $http, AuthFactory, angularPlayer, $ionicHistory, $ionicPopup, $ionicModal) {

    // $scope.userPhoto = baseUrl + 'images/avatar001.jpg';
    // $scope.userName = 'Neven';
    // $scope.introduction = 'An interesting guy';

    // console.log('personal');

    $scope.favList = [];
    $scope.userInfo = {};

    var userID = localStorage.getObject('Token', '{}').userID;
    var favListOrder = localStorage.getObject(userID, '[]');

    checkLoginStatus();
    loadFavlist();

    $ionicModal.fromTemplateUrl('templates/modification-page.html', {
      scope: null,
      animation: 'slide-in-up'
    }).then(function(modal) {
      // this $scope is modal isolated scope
      $scope.modificationModal = modal;
    });

    $scope.openModificationModal = function (username, introduction) {
      $scope.modificationModal.show();
      $scope.data.username = username;
      $scope.data.introduction = introduction;
    };

    function checkLoginStatus() {
      if (!AuthFactory.isAuthenticated()) {
        // ngDialog.open({
        //   template: 'views/loginReminder.html',
        //   className: 'ngdialog-theme-default'
        // });
        $ionicHistory.nextViewOptions({
          historyRoot: true
        });
        $state.go('app.home');

        $ionicPopup.alert({
          title: 'Reminder',
          template: '<p class="text-center">Hey! You need to log in to go on this operation.</p>',
          buttons: [{
            text: 'Got it!',
            type: 'button-positive'
          }]
        });
      }
    }

    function loadFavlist() {
      if (userID) {
        userFactory.favorite.get({
          id: userID
        }).$promise.then(function (response) {
          $scope.userInfo.username = response.username;
          $scope.userPhoto = baseUrl + 'images/avatar/' + response.avatar;
          $scope.userInfo.introduction = response.introduction;

          $rootScope.$broadcast('syncTo: modify', $scope.userInfo);

          // save favList order after drag & drop in a callback!! Not save to server,
          // only save in localStorage, and sync the order after get the response from server.
          angular.forEach(favListOrder, function (songID) {
              angular.forEach(response.favorites, function (item) {
                if (songID == item.songInfo._id) {
                  item.songInfo.id = item.songInfo._id;
                  item.songInfo.url = baseUrl + 'music/' + item.songInfo.url;
                  item.songInfo.albumCover = baseUrl + 'images/album/' + item.songInfo.albumCover;
                  $scope.favList.push(item.songInfo);
                }
              });
            }
          );
        }, function (err) {
          console.log(err);
        });
      }
    }

    $scope.playAll = function () {
      angularPlayer.stop();
      angularPlayer.setCurrentTrack(null);
      // clearPlaylist method needs a callback
      angularPlayer.clearPlaylist(function () {
        // console.log('Playlist is clear.');
      });

      $timeout(function () {
        angular.forEach($scope.favList, function (item) {
          item.favorite = true;
          angularPlayer.addTrack(item);
        });
        angularPlayer.play();
      }, 300);
    };

    // $scope.changeFavListOrder = function () {
    //   favListOrder = [];
    //   angular.forEach($scope.favList, function (item) {
    //     favListOrder.push(item._id);
    //   });
    //   localStorage.storeObject(userID, favListOrder);
    // };

    $scope.removeOneFromFav = function (item) {
      favFactory.updateFavoriteList(item);
      $rootScope.$broadcast('Favorite: remove one', item);
      // item.favorite = false;
      // console.log($scope.favList);
    };

    $scope.removeAllFromFav = function () {
      favFactory.removeAll();
    };

    $scope.checkUsername = function (data) {
      if (data == '') {
        return 'Username can not be empty!';
      }
      else {
        // check if the username has been used by others.
        var d = $q.defer();
        $http.put(baseUrl+'users/' + userID , {username: data})
          .then(function(res) {
            res = res || {};
            if(res.status == '200') {
              d.resolve()
            }
          }, function(err){
            if (err.status == 500) {
              d.reject('Username ' + data + ' has been already used!');
            }});
        return d.promise;
      }
    };

    $scope.saveUserInfo = function () {
      // make a put request to server to save information
      // console.log('save');
      userFactory.user.update({id: userID}, $scope.userInfo)
        .$promise.then(function (response) {
        // console.log(response);
      }, function (err) {
        console.log(err);
      });
    };

    $rootScope.$on('favoriteList: Update', function (event,data) {
      if (data.operation == 'add') {
        $scope.favList.push(data.song);
      } else {
        $scope.favList.splice($scope.favList.indexOf(data.song), 1);
      }
    });

  }])

  .controller('ModifyCtrl', function ($scope, userFactory, $rootScope, localStorage) {

    var userID = localStorage.getObject('Token', '{}').userID;

    $rootScope.$on('syncTo: modify', function (event, data) {
      console.log(data);
      $scope.userInfo = data;
    });

    // a potential problem

    // Due to angular data binding, the modification of userInfo without submission to sever will
    // change the value display in personal page. If user do not modify the value of userInfo,
    // this won't have a bad impact. But if the user change the value, and then close the modal, this
    // will have a bad impact which he thought the value from the server was changed, even though he doesn't
    // click on the submit button.

    $scope.saveUserInfo = function () {
      // make a put request to server to save information
      console.log('save');
      userFactory.user.update({id: userID}, $scope.userInfo)
        .$promise.then(function (response) {
        // console.log(response);
        $rootScope.$broadcast('syncTo: personal');
      }, function (err) {
        console.log(err);
      });
      $scope.modal.hide();
    };
  })

  .controller('UserCtrl', ['$scope', 'angularPlayer', '$stateParams','userFactory', 'baseUrl', '$timeout', function ($scope, angularPlayer, $stateParams, userFactory, baseUrl, $timeout) {

    $scope.favList = [];

    userFactory.favorite.get({
      id: $stateParams.id
    }).$promise.then(function (response) {
      $scope.userName = response.username;
      $scope.userPhoto = baseUrl + 'images/avatar/' + response.avatar;
      $scope.introduction = response.introduction;

      angular.forEach(response.favorites, function (item) {
        item.songInfo.id = item.songInfo._id;
        item.songInfo.albumCover = baseUrl + 'images/album/' + item.songInfo.albumCover;
        item.songInfo.url = baseUrl + 'music/' + item.songInfo.url;
        $scope.favList.push(item.songInfo);
      });

      // $timeout(function () {
      //   Grade(document.querySelectorAll('.gradient-wrap'));
      // }, 500);

    }, function (err) {
      console.log(err);
    });

    $scope.playAll = function () {
      angularPlayer.stop();
      angularPlayer.setCurrentTrack(null);
      // clearPlaylist method needs a callback
      angularPlayer.clearPlaylist(function () {
        // console.log('Playlist is clear.');
      });

      $timeout(function () {
        angular.forEach($scope.favList, function (item) {
          angularPlayer.addTrack(item);
        });
        angularPlayer.play();
        console.log(angularPlayer.getPlaylist());
      }, 300);
    };

    // $scope.userPhoto = 'images/avatar001.jpg';
    // $scope.userName = 'Neven';
    // $scope.introduction = 'An interesting guy';

    // $scope.favList = [
    //     {
    //         id: 1,
    //         title: 'SHIROBAKO',
    //         artist: 'Unknown',
    //         url: 'http://localhost:3000/music/SHIROBAKO.mp3',
    //         time: '3:08',
    //         favorite: true
    //     }
    //     {
    //         id: 2,
    //         title: 'Coming Home',
    //         artist: 'Diddy & Skylar Grey',
    //         url: 'http://localhost:3000/music/Diddy、Skylar Grey - Coming Home.mp3',
    //         time: '3:59',
    //         favorite: false
    //     }
    // ];



  }])

  .controller('ArtistCtrl', ['$scope', 'artistFactory', '$stateParams', 'baseUrl', 'angularPlayer', function ($scope, artistFactory, $stateParams, baseUrl, angularPlayer) {
    $scope.baseUrl = baseUrl;


    artistFactory.get({artistId: $stateParams.id}).$promise.then(
      function (response) {
        $scope.artistPhoto = $scope.baseUrl + 'images/artist/' + response.artistPhoto;
        $scope.artistName = response.artistName;
        $scope.introduction = response.introduction.replace(/\n/g, '\n\n');
        $scope.recommended = response.recommended;
      },
      function (err) {
        console.log(err);
      }
    )

  }])

  .controller('AboutCtrl', ['baseUrl', '$scope', function (baseUrl, $scope) {
    $scope.baseUrl = baseUrl;
  }])

  .directive('customizedActionSheet', ['$document', '$http', function($document, $http) {
    return {
      restrict: 'E',
      scope: true,
      replace: true,
      link: function($scope, $element) {

        var keyUp = function(e) {
          if (e.which == 27) {
            $scope.cancel();
            $scope.$apply();
          }
        };

        var backdropClick = function(e) {
          if (e.target == $element[0]) {
            $scope.cancel();
            $scope.$apply();
          }
        };
        $scope.$on('$destroy', function() {
          $element.remove();
          $document.unbind('keyup', keyUp);
        });

        $document.bind('keyup', keyUp);
        $element.bind('click', backdropClick);

        function loadTemplate (tmpl) {
          var config = {};
          config.headers = {'Accept': 'text/html'};

          return $http.get(tmpl, config).then(function(res) {
            console.log(res);
            return res.data || '';
          });
        }
      },
      template: loadTemplate(templateUrl)
    };
  }]);



