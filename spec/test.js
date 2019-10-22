const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const regex = require('../constants/regex');
const User = require('../model/User');
const app = require('../app');

let mockUserToken;
let mockUser = {
  id: 'sample1',
  name: '테스트',
  password: '123qwe!',
  password_confirm: '123qwe!',
  first_meet_day: new Date(),
  phone_number: '01012341234'
};

/**
 * 1. POST /signUp
 */
describe('POST /signUp', () => {
  let mockUserData;

  before(async () => {
    const user = await User.findOne({ id: mockUser.id });

    if (user) {
      await User.findOneAndDelete(({ id: mockUser.id }));
    }
  });

  beforeEach(() => {
    mockUserData = {
      id: 'sample1',
      name: '테스트',
      password: '123qwe!',
      password_confirm: '123qwe!',
      first_meet_day: new Date(),
      phone_number: '01012341234'
    };
  });

  it('should respond with error if user id is not exist', (done) => {
    mockUserData.id = '';

    request(app)
      .post('/signUp')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.REQUIRED_ID);
        done();
      });
  });

  it('should respond with error if user password is invalid', (done) => {
    mockUserData.password = '123456';
    mockUserData.password_confirm = '123456';

    request(app)
      .post('/signUp')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.INVALID_PASSWORD);
        done();
      });
  });

  it('should respond with error if user password does not match password confirmation', (done) => {
    mockUserData.password_confirm = '12345';

    request(app)
      .post('/signUp')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.MATCH_PASSWORD);
        done();
      });
  });

  it('should respond with success json after sign up', (done) => {
    request(app)
      .post('/signUp')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err);

        const newUser = await User.findOne({ id: mockUserData.id });

        expect(res.body.result).to.equal('ok');
        expect(newUser).to.exist;

        mockUser = { ...mockUserData };
        done();
      });
  });

  it('should respond with error if a user sign up with id which already exists', (done) => {
    request(app)
      .post('/signUp')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.DUPLICATE_ID);
        done();
      });
  });
});

/**
 * 2. POST /login
 */
describe('POST /login', () => {
  let mockUserData;

  beforeEach(() => {
    mockUserData = {
      id: 'sample1',
      password: '123qwe!'
    };
  });

  it('should respond with error if user login with invalid id', (done) => {
    mockUserData.id = '00000';

    request(app)
      .post('/login')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.text).to.equal('Unauthorized');
        done();
      });
  });

  it('should respond with error if user login with invalid password', (done) => {
    mockUserData.password = '00000';

    request(app)
      .post('/login')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.text).to.equal('Unauthorized');
        done();
      });
  });

  it('should respond with token which contains user id after login', (done) => {
    request(app)
      .post('/login')
      .send(mockUserData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        const { result, token, userId } = res.body;

        expect(result).to.equal('ok');
        expect(token).to.exist;
        expect(userId).to.equal(mockUserData.id);

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        expect(decoded).to.equal(mockUserData.id);

        mockUserToken = token;
        done();
      });
  });
});

/**
 * 3. PUT /profile
 */
describe('PUT /profile', () => {
  let mockProfile;

  beforeEach(() => {
    mockProfile = {
      name: '테스트',
      phone_number: '01011111111',
      personal_message: 'hello'
    };
  });

  it('should respond with error if user profile has invalid field(phone_number)', (done) => {
    mockProfile.phone_number = '1111111111111111111';

    request(app)
      .put('/profile')
      .send(mockProfile)
      .set({ 'Authorization': `Bearer ${mockUserToken}`, Accept: 'application/json' })
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.INVALID_PHONE_NUM);
        done();
      });
  });

  it('should respond with error if user profile has invalid field(personal_message)', (done) => {
    mockProfile.personal_message = 'abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdea';

    request(app)
      .put('/profile')
      .send(mockProfile)
      .set({ 'Authorization': `Bearer ${mockUserToken}`, Accept: 'application/json' })
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.validationError).to.equal(regex.INVALID_PERSONAL_MESSAGE_LENGTH);
        done();
      });
  });

  it('should not update profile with invalid token', (done) => {
    request(app)
      .put('/profile')
      .send(mockProfile)
      .set({ 'Authorization': `Bearer falsy-token`, Accept: 'application/json' })
      .expect(401)
      .end(async (err, res) => {
        if (err) return done(err);

        expect(res.text).to.equal('Unauthorized');

        const user = await User.findOne({ id: mockUser.id });

        expect(user.phone_number).to.equal(mockUser.phone_number);
        expect(user.personal_message).to.equal(mockUser.personal_message);

        done();
      });
  });

  it('should respond with success json after user profile updated', (done) => {
    request(app)
      .put('/profile')
      .send(mockProfile)
      .set({ 'Authorization': `Bearer ${mockUserToken}`, Accept: 'application/json' })
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err);

        const updatedUser = await User.findOne({ id: mockUser.id });

        expect(updatedUser.phone_number).to.equal(mockProfile.phone_number);
        expect(updatedUser.personal_message).to.equal(mockProfile.personal_message);

        mockUser.phone_number = mockProfile.phone_number;
        mockUser.personal_message = mockProfile.personal_message;
        done();
      });
  });
});

/**
 * 4. GET /users
 */
describe('GET /users', () => {
  it('should not get user data with invalid token', (done) => {
    request(app)
      .get('/users')
      .set({ 'Authorization': `Bearer falsy-token`, Accept: 'application/json' })
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.text).to.equal('Unauthorized');
        done();
      });
  });

  it('should respond with user data', (done) => {
    request(app)
      .get('/users')
      .set({ 'Authorization': `Bearer ${mockUserToken}`, Accept: 'application/json' })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body.userProfile.id).to.equal(mockUser.id);
        expect(res.body.userProfile.name).to.equal(mockUser.name);
        expect(res.body.userProfile.phone_number).to.equal(mockUser.phone_number);
        done();
      });
  });
});

/**
 * 5. PUT /users/pushToken
 */
describe('PUT /users/pushToken', () => {
  let mockPushToken = 'expoPushToken';

  it('should not update user pushToken with invalid jwt token', (done) => {
    request(app)
      .put('/users/pushToken')
      .set({ 'Authorization': `Bearer falsy-token`, Accept: 'application/json' })
      .send({ pushToken: mockPushToken })
      .expect(401)
      .end(async (err, res) => {
        if (err) return done(err);

        expect(res.text).to.equal('Unauthorized');

        const user = await User.findOne({ id: mockUser.id });
        expect(user.push_token).to.equal(undefined);
        done();
      });
  });

  it('should respond with success json after user pushToken updated', (done) => {
    request(app)
      .put('/users/pushToken')
      .set({ 'Authorization': `Bearer ${mockUserToken}`, Accept: 'application/json' })
      .send({ pushToken: mockPushToken })
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err);

        expect(res.body.result).to.equal('ok');

        const user = await User.findOne({ id: mockUser.id });
        expect(user.push_token).to.equal(mockPushToken);
        done();
      });
  });

  after(async () => {
    await User.findOneAndDelete(({ id: mockUser.id }));
  });
});
