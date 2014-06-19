var express = require('express');
var app = express();
var idSequence = 0;

var session;
var resetSession = function() {
    session = {
        assessment: { id: '87a05a80-7410-4028-aa67-62e1faee36a6',
            deck_id: 'f5bc482e-8a2a-45c1-a7d4-8574625396b9',
            completed_at: null,
            created_at: 1403146483844
        },
        slidesCompleted: 0,
        users: [],
        answers: []
    };
};
resetSession();

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


var getSlidesFromTraitify = function() {
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

getSlidesFromTraitify();

var getActiveSlide = function() {
    var position = Math.min(session.slidesCompleted, session.slides.length);
    return session.slides[position];
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
    console.log(userid);
    var slide = getActiveSlide();
    if(!session.answers[slide.id]) {
        session.answers[slide.id] = [];
    }

    session.answers[slide.id][userid] = req.body.answers;

    console.log("Answers: " + JSON.stringify(session.answers));
    res.send({result: 'ok'});
});

app.listen(3000);
console.log('Listening on port 3000...');