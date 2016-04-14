var app = angular.module('flapperNews', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider.state('home', {
		url : '/home',
		templateUrl : '/home.html',
		controller : 'MainCtrl',
		resolve : {
			postPromise : ['posts',
			function(posts) {
				return posts.getAll();
			}]

		}
	}).state('posts', {
		url : '/posts/:id',
		templateUrl : '/posts.html',
		controller : 'PostsCtrl',
		resolve : {
			post : ['$stateParams', 'posts',
			function($stateParams, posts) {
				return posts.get($stateParams.id);
			}]

		}
	}).state('login', {
		url : '/login',
		templateUrl : '/login.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]

	}).state('register', {
		url : '/register',
		templateUrl : '/register.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]

	});

	$urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	}

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));
            console.log(payload);
			return payload.username;
		}
	};

	auth.register = function(user) {
        console.log('we got hee bro');
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}]);

app.factory('posts', ['$http', 'auth',
function($http, auth) {
	var o = {
		posts : []
	};

	o.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};
	//now we'll need to create new posts
	//uses the router.post in index.js to post a new Post mongoose model to mongodb
	//when $http gets a success back, it adds this post to the posts object in
	//this local factory, so the mongodb and angular data is the same
	//sweet!
	o.create = function(post,user) {
	  return $http.post('/posts', post, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
          user.somefield=data;
          console.log(user);
          console.log("Ok heres my user post" +data);
          $http.post('/addID/'+data._id, user).success(function(data2) {
			auth.saveToken(data2.token);
		});
	    o.posts.push(data);
	  });
	};
	
	o.upvote = function(post) {
        console.log(auth.currentUser()+' this is the current user');
	  return $http.put('/posts/' + post._id + '/upvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    post.upvotes += 1;
	  });
	};
    o.upvotePersistent = function(post) {
	  return $http.put('/posts/' + post._id +'/'+auth.currentUser()+ '/upvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
          //data needs to be refreshed on both client and 
	    post.upvotes += 1;
        post.upvotedBy.push(auth.currentUser());
	  });
	};
    
	//downvotes
	o.downvote = function(post) {
	  return $http.put('/posts/' + post._id + '/downvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    post.upvotes -= 1;
	  });
	};
	//grab a single post from the server
	o.get = function(id) {
		//use the express route to grab this post and return the response
		//from that route, which is a json of the post data
		//.then is a promise, a kind of newly native thing in JS that upon cursory research
		//looks friggin sweet; TODO Learn to use them like a boss.  First, this.
		return $http.get('/posts/' + id).then(function(res) {
			return res.data;
		});
	};
	//comments, once again using express
	o.addComment = function(id, comment) {
	  return $http.post('/posts/' + id + '/comments', comment, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};
	
	o.upvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes += 1;
	  });
	};	
    o.upvoteCommentPersistent = function(post, comment) {
	  return $http.put('/posts/' + post._id +'/'+auth.currentUser()+ '/comments/'+ comment._id + '/upvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes += 1;
          comment.upvotedBy.push(auth.currentUser());
	  });
	};
	//downvote comments
	//I should really consolidate these into one voteHandler function
	o.downvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvote', null, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes -= 1;
	  });
	};	
	return o;
}]);



app.controller('MainCtrl', ['$scope', 'posts', 'auth',
function($scope, posts, auth) {
	$scope.posts = posts.posts;
	$scope.isLoggedIn = auth.isLoggedIn;
	//setting title to blank here to prevent empty posts
    
	$scope.title = '';

	$scope.addPost = function() {
		if ($scope.title === '') {
			return;
		}
		posts.create({
			title : $scope.title,
			link : $scope.link,
		});
		//clear the values
		$scope.title = '';
		$scope.link = '';
	};

	$scope.upvote = function(post) {
		//our post factory has an upvote() function in it
		//we're just calling this using the post we have
		console.log('Upvoting:' + post.title + "votes before:" + post.upvotes);
		posts.upvote(post);
	};
	$scope.downvote = function(post) {
		posts.downvote(post);
	};
}]);

app.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth',
function($scope, posts, post, auth) {
	$scope.post = post;
    console.log(post);
	$scope.isLoggedIn = auth.isLoggedIn;
    $scope.showError=false;
    $scope.showSuccess=false;
	$scope.addComment = function() {
        $scope.showError=false;
    $scope.showSuccess=false;
		if (!$scope.body) {
            $scope.showError= true;
        
		}else{
        console.log("OOPS NOT SUPPOSED TO BE HERE");
		posts.addComment(post._id, {
			body : $scope.body,
			author : 'user',
            upvotedBy:[]
		}).success(function(comment) {
			$scope.post.comments.push(comment);
            $scope.showSuccess =true;
            
            
		});
		$scope.body = ''; }
	};
	$scope.upvote = function(comment) {
		posts.upvoteComment(post, comment);
	};
    $scope.upvoteCommentPersistent = function(comment) {
        console.log('upvote comment persistent was just called');
        posts.upvoteCommentPersistent(post, comment);
	};
    
    $scope.upvotePost = function(post) {
		//our post factory has an upvote() function in it
		//we're just calling this using the post we have
		console.log('Upvoting:' + post.title + "votes before:" + post.upvotes);
		posts.upvote(post);
       
	};
    $scope.upvotePostPersistent = function(post) {
        console.log('upvote post persistent was just called');
		console.log('Upvoting:' + post.title + "votes before:" + post.upvotes);
		posts.upvotePersistent(post);
     
	};
	$scope.downvote = function(comment) {
		posts.downvoteComment(post, comment);
	};
    $scope.showCommentActive = function(comment){
    if (comment.upvotedBy.indexOf(auth.currentUser())!=-1){ //or 'user'
 	  // console.log('the array contains the item, so you liked the comment  already');
	   return 'false';
	 }
    else{
 //	  console.log('nope not in the comment so you havent liked the comment before');
        return 'true';
    }
    };
    $scope.showPostActive = function(post){
        console.log("the post's upvoted by array" + post.upvotedBy);
        console.log(post.upvotedBy);
    if (post.upvotedBy.indexOf(auth.currentUser())!=-1){ //or 'user'
 	   console.log('the array contains the item, so you liked the post already');
	   return 'false';
	 }
    else{
 	  console.log('nope not in the array so you havent liked the post before');
        return 'true';
    }
    }

}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', 'posts', 
function($scope, $state, auth, posts) {
	$scope.user = {};
    console.log(posts.posts);
    $scope.showError2 =false;
    $scope.errorMessage ="";
    $scope.showError3 =false;
    $scope.errorMessage2 ="";

	$scope.register = function() {
        //console.log("name: "+ $scope.user.name);
        if(!$scope.user.name ||!$scope.user.position||!$scope.user.location||!$scope.user.desc||!$scope.user.since){
                $scope.errorMessage ="Fields cannot be left blank";
            $scope.showError2=true;
            return;

            }
		auth.register($scope.user).error(function(error) {
			$scope.error = error;
            console.log(error);
            $scope.showError2=true;
            if(error.message==='bad password'){
                $scope.errorMessage ="Invalid password choice";
            }if(error.message==='bad username'){
                $scope.errorMessage ="Invalid username choice";
            }if(error.message==='username taken'){
                $scope.errorMessage ="Username is taken";
            }
            
		}).then(function() {
            posts.create({
                name: $scope.user.name,
			    position : $scope.user.position,
                location:$scope.user.location,
                desc: $scope.user.desc,
                since: $scope.user.since,
                upvotedBy:[]

        },$scope.user);
			//$state.go('home');
		});
	};

	$scope.logIn = function() {
        
		auth.logIn($scope.user).error(function(error) {
			$scope.error = error;
            $scope.showError3=true;
            $scope.errorMessage2 =error.message;


		}).then(function() {
			$state.go('home');
		});
	};
}]);

app.controller('NavCtrl', ['$scope', 'auth',
function($scope, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;
}]);

