var express = require('express');
var app = express();
var idSequence = 0;

var session;

var traitify = require("traitify");

// live url
//traitify.setHost("api.traitify.com");

// testing url
traitify.setHost("api-sandbox.traitify.com");

traitify.setVersion("v1");
traitify.setPrivateKey("p175o09j0ff37o1iqgrdkia4be");

console.log(traitify);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.configure(function() {
    app.use(express.bodyParser());
    app.use(allowCrossDomain);
});


/** CREATE ASSESSMENT DISABLED
traitify.createAssessment("f5bc482e-8a2a-45c1-a7d4-8574625396b9", function(assessment){
    // Use assessment here.
    console.log(assessment);
    session.assessment = assessment;
});
*/


getSlidesFromTraitify = function() {
    traitify.getSlides(session.assessment.id, function(slides){
        session.slides = slides;
        console.log(slides);

        /* slides contain the following information
        slide.id                    // the slide's id
        slide.position              // the order in which this slide should be presented to the user
        slide.caption               // the caption to display above the image
        slide.image_desktop         // the desktop size of the image
        slide.image_desktop_retina  // the desktop retina size of the image
        slide.image_phone_landscape // the phone size of the image for landscape mode
        slide.image_phone_portrait  // the phone size of the image for portrait mode
        slide.response              // the user's response, boolean
        slide.time_taken            // the time taken (in milliseconds) for the user to respond, integer
        slide.completed_at          // the date the slide was responded to
        slide.created_at            // the date the slide was created for this assessment
        */
    });
};

var resetSession = function() {
    idSequence = 0;
    session = {
        assessment: { id: '87a05a80-7410-4028-aa67-62e1faee36a6',
            deck_id: 'f5bc482e-8a2a-45c1-a7d4-8574625396b9',
            completed_at: null,
            created_at: 1403146483844
        },
        slidesCompleted: 0,
        users: [],
        answers: {}
    };

    getSlidesFromTraitify();
};
resetSession();

var getActiveSlide = function() {
    var position = Math.min(session.slidesCompleted, session.slides.length);
    return session.slides[position];
};

var getSlideById = function(slideId) {
    var result = null;
    session.slides.forEach(function(item) {
        if(item.id == slideId) {
            result = item;
        }
    });
    return result;
};

var moveToNextSlide = function() {
    session.slidesCompleted++;
    console.log("Moving to next slide!")
};

var getAnswerCountForSlideById = function(slideId) {
    //console.log("getAnswerCount slide id: " + slideId);
    var slide = getSlideById(slideId);
    //console.log("getAnswerCount slide: " + JSON.stringify(slide));
    if(session.answers[slide.position]) {
        var answerCount = Object.keys(session.answers[slide.position]).length;
        return answerCount;
    } else {
        return 0;
    }
};

app.get('/reset', function(req, res) {
    resetSession();

    res.send({
        result: 'ok'
    });
});
app.get('/users', function(req, res) {
    res.send({
        users: session.users
    });
});
app.post('/users', function(req, res) {
    if(session.users.length >= 2) {
        resetSession();
    }

    console.log("User connected with data: " + JSON.stringify(req.body));
    var user = req.body.user;
    user.id = idSequence++;
    session.users.push(user);

    console.log("Userlist: " + JSON.stringify(session.users));

    res.send({
        id: user.id
    });
});
app.get('/slide', function(req, res) {
    res.send({
        activeSlide: getActiveSlide()
    });
});
app.post('/users/:id/answers', function(req, res) {
    var userid = req.params.id;
    var userAnswers = req.body.answers;
    var slide = getActiveSlide();

    if(!session.answers[slide.position]) {
        session.answers[slide.position] = {};
    }
    session.answers[slide.position][userid] = userAnswers;

    //console.log("UserId: " + userid);
    //console.log("Slide: " + JSON.stringify(slide));
    //console.log("Submitted answers: " + JSON.stringify(userAnswers));
    //console.log("Answers: " + JSON.stringify(session.answers));

    var answerCount = getAnswerCountForSlideById(slide.id);
    console.log("Answer count for this: " + answerCount);
    if(answerCount >= 2) {
        moveToNextSlide();
    }

    res.send({result: 'ok'});
});

app.get('/slide/:id/results', function(req, res) {
	var slideId = req.params.id;
	//console.log("Slide ID: " + slideId);
    var position = getSlideById(slideId).position;
    //console.log("Position: " + position);
	var answers = session.answers[position];
    var answerCount = getAnswerCountForSlideById(slideId);
	if (answerCount >= 2) {
		//Return the answers
        //console.log("Answers at this position: " + JSON.stringify(answers));
        answers['0'].correct = answers['0']['1'] == answers['1']['1'];
        answers['1'].correct = answers['1']['0'] == answers['0']['0'];

        var user0 = session.users[0];
        var correctstr = answers['0'].correct ? " was correct!" : " was not correct!";
        console.log(user0.name + correctstr);

        var user1 = session.users[0];
        correctstr = answers['1'].correct ? " was correct!" : " was not correct!";
        console.log(user1.name + correctstr);

        res.send({
            answers: answers
        });
	} else {
		console.log("Everyone hasn't answered yet on slide: " + slideId);
		res.send({
			results: null
		});
	}

});

app.listen(3000);
console.log('Listening on port 3000...');