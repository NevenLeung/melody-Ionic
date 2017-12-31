// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
// var  noop = angular.noop,
//   jqLite = angular.element,
//   extend = angular.extend;

angular.module('melody', ['ui.router', 'ngResource', 'angularSoundManager', 'ionic', 'melody.controllers', 'melody.services'])

// angular.module('melody', ['ngResource', 'ionic', 'angularSoundManager', 'melody.controllers', 'melody.services'])

  .run(function($ionicPlatform, $rootScope, $ionicLoading, $ionicHistory) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    $rootScope.$on('loading:show', function () {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner><p>Loading...</p>'
      });
    });

    $rootScope.$on('loading:hide', function () {
      $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function () {
      // console.log($ionicHistory.viewHistory());
      // console.log('loading');
      $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function () {
      // console.log('done');
      $rootScope.$broadcast('loading:hide');
    });
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/sidebar.html',
      controller: 'PlayerCtrl'
    })

    .state('app.home', {
      url: '/home',
      views: {
        'mainContent': {
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl'
        }
      }
    })

    .state('app.song', {
      url: '/song/:id',
      views: {
        'mainContent': {
          templateUrl: 'templates/song-page.html',
          controller: 'SongCtrl'
        }
      }
    })

    .state('app.personal', {
      url: '/personal',
      views: {
        'mainContent': {
          templateUrl: 'templates/personal-page.html',
          controller: 'PersonalCtrl'
        }
      },
      //To disable the cache for personal page, prevent visitor enter personal page without logging in.
      cache: false
    })

    .state('app.user', {
      url: '/user/:id',
      views: {
        'mainContent': {
          templateUrl: 'templates/user-info-page.html',
          controller: 'UserCtrl'
        }
      }
    })

    .state('app.artist', {
      url: '/artist/:id',
      views: {
        'mainContent': {
          templateUrl: 'templates/artist-page.html',
          controller: 'ArtistCtrl'
        }
      }
    })

    .state('app.about', {
      url: '/about',
      views: {
        'mainContent': {
          templateUrl:'templates/about-page.html',
          controller: 'AboutCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('app/home');

  // $urlRouterProvider.otherwise('tab/dash');

})

;
