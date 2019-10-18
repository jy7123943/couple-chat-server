const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const chatRoom = await ChatRoom.findById(req.user.chatroom_id);

    return res.json({ chats: chatRoom.chats });
  } catch (err) {
    console.log(err);
    next(err);
  }
});


router.post('/analysis', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const DAYS_AGO = 30;
    const endDate = new Date();
    const startDate = new Date(endDate - (3600000 * 24 * DAYS_AGO));

    console.log(startDate, endDate);

    const [ data ] = await ChatRoom.aggregate([
      {
        $match: {
          _id: req.user.chatroom_id,
          'chats.created_at': {
            '$gt': startDate,
            '$lt': endDate
          }
        }
      }
    ]);

    // console.log(data.chats);

    const extractedAllText = data.chats.map(chat => chat.text).join('. ');

    // console.log(extractedAllText)

    const partnerTexts = [];
    const userTexts = data.chats.filter(chat => {
      if (chat.user_id !== req.user.id) {
        partnerTexts.push(chat);
      } else {
        return true;
      }
    });

    const extractedUserText = userTexts.map(chat => chat.text).join('. ');
    const extractedPartnerText = partnerTexts.map(chat => chat.text).join('. ');

    console.log('총 텍스트: ', extractedAllText.length)
    console.log('내가 보낸 텍스트: ', extractedUserText.length);
    console.log('파트너가 보낸 텍스트: ', extractedPartnerText.length);

    const document = {
      content: extractedAllText,
      type: 'PLAIN_TEXT',
    };


    // Detects the sentiment of the document
    /*
    const [ result ] = await client.analyzeSentiment({ document });
    console.log(JSON.stringify(result, null, 5));

    console.log(result);
    console.log(util.inspect(result, {showHidden: false, depth: null}));

    const sentiment = result.documentSentiment;
    console.log(`Document sentiment:`);
    console.log(`  Score: ${sentiment.score}`); // 전체 점수
    console.log(`  Magnitude: ${sentiment.magnitude}`);

    // 우리 대화의 가장 부정적인 단어:
    // 우리 대화의 가장 긍정적인 단어

    const sentences = result.sentences;

    sentences.sort((left, right) => left.sentiment.score - right.sentiment.score);
    sentences.forEach(sentence => {
      console.log(`Sentence: ${sentence.text.content}`);
      console.log(`  Score: ${sentence.sentiment.score}`);
      console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
    });
    */
    res.json({ result: 'ok' });
  } catch (err) {
    console.log('error: ',err);
  }
});

module.exports = router;
