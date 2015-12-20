'use strict';

Template.collections.helpers({
    collections: function () {
        return MCollections.find(
            { name: { $ne: 'NEW COLLECTION' } },
            { sort: { place_count: -1 }});
    }
});

    /*
    $scope.collections = [];
    $scope.collection_permissions = {};

    Collection.all().$loaded(function (collections) {
        angular.forEach(collections, function (collection) {
            var key = collection.$id;
            Auth.hasReadPermissions(key).then(function (p) {
                if(p) {
                    $scope.collections.push(collection);
                    var uid = $rootScope.user ? $rootScope.user.creatorUID :
                        undefined;
                    $scope.collection_permissions[key] = 
                         Auth.getPermissions(key, uid);
                }
            });
        });
    });

    $scope.myRole = function (id) {
        // permissions are pyramidal
        var ua = $scope.collection_permissions[id];
        if(!ua) {
            return 'nothing';
        }
        var uid = $rootScope.user ? $rootScope.user.creatorUID :
            undefined;
        if(Auth.collectionCreator(ua) === uid) {
            return 'Creator';
        }
        if(Auth.isOwner(ua)) {
            return 'Owner';
        }
        if(Auth.isWriter(ua)) {
            return 'Writer';
        }
        if(Auth.isReader(ua)) {
            return 'Reader';
        }
        return 'nothing';
    };

    $scope.publicReading = function (id) {
        var ua = $scope.collection_permissions[id];
        return Auth.publicReading(ua);
    };

    $scope.publicWriting = function (id) {
        var ua = $scope.collection_permissions[id];
        return Auth.publicWriting(ua);
    };
    */