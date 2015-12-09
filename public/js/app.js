var app = angular.module('GroceryListApp', ['ui.bootstrap', 'ngCookies', 'duScroll']);

app.factory('userObj', function($q, $cookies, $http) {
    var userObjDeferred = $q.defer();
    var getId = function() {
        idDeferred = $q.defer();
        var cookies = $cookies.getAll();
        if (cookies._id) {
            idDeferred.resolve(cookies._id)
        } else {
            $http.get('/createUser').then(function(res) {
                var id = res.data;
                $cookies.put('_id', id);
                console.log('user created');
                idDeferred.resolve(res.data);
            }, function(err) {
                console.log(err);
            });
        }
        return idDeferred.promise;
    };
    getId().then(function(res) {
        var id = res;
        $http({
            mehtod: 'GET',
            url: '/users',
            params: {
                _id: id
            }
        }).then(function(res) {
            userObjDeferred.resolve(res.data);
        }, function(err) {
            console.log(err);
        });
    }, function(err) {
        console.log(err);
    });
    return userObjDeferred.promise;
});

app.service('template', function($q, $http) {
    this.get = function() {
        return $q(function(resolve, reject) {
            $http.get('/template').then(function(res) {
                resolve(res.data);
            }, function(err) {
                reject(err);
            });
        })
    }
});

app.service('updateUser', function($q, $http) {
    this.post = function(postData) {
        return $q(function(resolve, reject) {
            $http.post('/updateUser', angular.toJson(postData)).
            then(function(res) {
                resolve(res);
                console.log('updated');
            }, function(err) {
                reject(err);
            });
        });
    };
});

app.directive('nav', function($rootScope, $window) {
    return {
        restrict: 'A',
        link: function(scope, iElement, iAttrs) {
            angular.element($window).on('scroll', function() {
                var elmOffset = iElement[0].offsetTop;
                var elmHeight = iElement[0].clientHeight;
                var totalOffset = elmHeight + elmOffset;
                var scrollPos = document.body.scrollTop;
                var screenWidth = screen.width;
                if (scrollPos > totalOffset && screenWidth <= 450) {
                    $rootScope.stickyBool = true;
                    $rootScope.$apply();
                } else {
                    $rootScope.stickyBool = false;
                    $rootScope.$apply();
                }
            });
        }
    }
});


app.controller('NavController', function($scope, $rootScope, userObj, updateUser) {
    $scope.getUserObj = function() {
        userObj.then(function(res) {
            $scope.userObj = res;
        });
    };
    $scope.getUserObj();
    $scope.updateUser = function() {
        updateUser.post($scope.userObj).
        then(function(res) {});
    };
    $scope.changeStep = function(mode) {
        $scope.userObj.step = mode;
        $scope.updateUser();
        if (mode == 'shopping') {
            $rootScope.shoppingBool = true;
        }
    };
    $rootScope.blankBool = false;
    $scope.blankList = function() {
        var confirmBool = confirm('Are you sure you want to start over?');
        if (confirmBool) {
            $rootScope.blankBool = true;
        }
    };
});

app.controller('CheckListController', function($scope, $rootScope, $document, userObj, updateUser, template) {
    $scope.getUserObj = function() {
        userObj.then(function(res) {
            $scope.userObj = res;
            $scope.itemCountFunc();
        });
    };
    $scope.getUserObj();
    $scope.updateUser = function() {
        updateUser.post($scope.userObj).
        then(function(res) {});
    };
    $scope.other = [];
    $scope.addOther = function(index) {
        if ($scope.other[index]) {
            var otherObject = {
                name: $scope.other[index],
                selectedCheck: true,
                selectedShopping: false
            };
            $scope.userObj.list[index].other.push(otherObject);
            $scope.other[index] = '';
        }
    };
    $scope.itemCountFunc = function() {
        $scope.userObj.itemsSelectedCheck = 0;
        for (var i = 0; i < $scope.userObj.list.length; i++) {
            for (var j = 0; j < $scope.userObj.list[i].items.length; j++) {
                if ($scope.userObj.list[i].items[j].selectedCheck) {
                    $scope.userObj.itemsSelectedCheck++;
                }
            }
            for (var k = 0; k < $scope.userObj.list[i].other.length; k++) {
                if ($scope.userObj.list[i].other[k].selectedCheck) {
                    $scope.userObj.itemsSelectedCheck++;
                }
            }
        }
        $scope.updateUser();
    };
    $scope.checkBoxClick = function() {
        $scope.checkBoxBool = true;
    };
    $scope.itemClick = function(item) {
        if (!$scope.checkBoxBool) {
            item.selectedCheck = !item.selectedCheck;
        } else {
            $scope.checkBoxBool = false;
        }
    };
    $scope.keyPressAdd = function(event, index) {
        var keyCode = event.which || event.keyCode;
        if (keyCode == 13) {
            $scope.addOther(index);
            $scope.itemCountFunc();
        }
    };
    $scope.clickUpdate = function() {
        $scope.itemCountFunc();
        $scope.updateUser();
    };
    $scope.blankUserObj = function() {
        template.get(function() {}).then(function(res) {
            $scope.userObj.list = res.list;
            $scope.userObj.itemsSelectedCheck = 0;
            $scope.userObj.itemsSelectedShopping = 0;
            $scope.userObj.step = 'checking';
            $scope.updateUser();
        });

    };
    $rootScope.$watch('blankBool', function(newVal, oldVal) {
        if ($rootScope.blankBool) {
            $scope.blankUserObj();
            $scope.getUserObj();
            $rootScope.blankBool = false;
            $rootScope.clearShoppingBool = true;
        }
    });
    $scope.toTop = function() {
        $document.scrollTo(0, 0, 500);
    };
});

app.controller('ShoppingListController', function($scope, $rootScope, userObj, updateUser) {
    userObj.then(function(res) {
        $scope.userObj = res;
        $scope.removeUncheckedItems();
        $scope.itemCountFunc();
        $scope.getPercentage();
    });
    $scope.$watch('shoppingBool', function(newVal, oldVal) {
        if ($rootScope.shoppingBool) {
            $scope.removeUncheckedItems();
            $scope.itemCountFunc();
            $scope.getPercentage();
            $rootScope.shoppingBool = false;
        }
    });
    $scope.isPopulated = function(category) {
        for (var i = 0; i < category.items.length; i++) {
            if (category.items[i].selectedCheck) {
                return true;
            }
        }
        for (var j = 0; j < category.other.length; j++) {
            if (category.other[j].selectedCheck) {
                return true;
            }
        }
    };
    $scope.removeUncheckedItems = function() {
        for (var i = 0; i < $scope.userObj.list.length; i++) {
            for (var j = 0; j < $scope.userObj.list[i].items.length; j++) {
                if (!$scope.userObj.list[i].items[j].selectedCheck) {
                    $scope.userObj.list[i].items[j].selectedShopping = false;
                }
            }
            for (var k = 0; k < $scope.userObj.list[i].other.length; k++) {
                if (!$scope.userObj.list[i].other[k].selectedCheck) {
                    $scope.userObj.list[i].other[k].selectedShopping = false;
                }
            }
        }
    };
    $scope.updateUser = function() {
        updateUser.post($scope.userObj).
        then(function(res) {});
    };
    $scope.getPercentage = function() {
        $scope.completePercentage = Math.round(($scope.userObj.itemsSelectedShopping / $scope.userObj.itemsSelectedCheck) * 100) || 0;
    };
    $rootScope.$watch('clearShoppingBool', function(newVal, oldVal) {
        if ($rootScope.clearShoppingBool) {
            $scope.completePercentage = 0;
            $rootScope.clearShoppingBool = false;
        }
    });
    $scope.itemCountFunc = function() {
        $scope.userObj.itemsSelectedShopping = 0;
        for (var i = 0; i < $scope.userObj.list.length; i++) {
            for (var j = 0; j < $scope.userObj.list[i].items.length; j++) {
                if ($scope.userObj.list[i].items[j].selectedShopping) {
                    $scope.userObj.itemsSelectedShopping++;
                }
            }
            for (var k = 0; k < $scope.userObj.list[i].other.length; k++) {
                if ($scope.userObj.list[i].other[k].selectedShopping) {
                    $scope.userObj.itemsSelectedShopping++;
                }
            }
        }
    };
    $scope.checkBoxClick = function() {
        $scope.checkBoxBool = true;
    };
    $scope.itemClick = function(item) {
        if (!$scope.checkBoxBool) {
            item.selectedShopping = !item.selectedShopping;
        } else {
            $scope.checkBoxBool = false;
        }
    };
    $scope.clickUpdate = function() {
        $scope.updateUser();
        $scope.itemCountFunc();
        $scope.getPercentage();
    };
});