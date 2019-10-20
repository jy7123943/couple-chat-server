const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();
const textAnalysisSample = require('./textAnalysisSample.json');

const sampleee = {
  "balance": {
    "partner": 92,
    "perfectScore": 30,
    "score": 13.142857142857142,
    "user": 210
  },
  "textAmount": {
    "average": 275,
    "perfectScore": 30,
    "score": 30,
    "userRoom": 302,
  },
  "negativeTexts": [
    "아니",
    "그러네",
    "또안돼!",
    "의미없다..",
    "뭐하냥",
  ],
  "positiveTexts": [
    "꿀잼",
    "올 주연님~~~~",
    "아. 근데",
    "우와ㅓㅓ",
    "옹",
  ],
  "sentiment": {
    "perfectScore": 40,
    "score": 20,
  },
  "totalScore": 63.14285714285714,
};

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const chatRoom = await ChatRoom.findById(req.user.chatroom_id);
    console.log(req.user, chatRoom);

    if (!chatRoom) {
      return res.json({ error: '채팅 기록이 없습니다.' });
    }
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
    console.log(req.user.chatroom_id);

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

    if (!data) {
      return res.status(400).json({ error: '해당 기간의 데이터가 충분하지 않습니다.' });
    }

    const allData = await ChatRoom.aggregate([
      {
        $match: {
          // _id: { $not: { $eq: req.user.chatroom_id }},
          'chats.created_at': {
            '$gt': startDate,
            '$lt': endDate
          }
        }
      }
    ]);

    const extractOnlyTexts = (data) => {
      return data.map(chat => {
        const chatDate = new Date(chat.created_at);
        if (chatDate > startDate && chatDate < endDate) {
          return chat.text;
        }
        return '';
      });
    };

    const otherChatRoomTextsLength = allData.map(chatroom => {
      return extractOnlyTexts(chatroom.chats).join('').length;
    });
    console.log('다른 채팅방 텍스트 길이', otherChatRoomTextsLength);

    const sum = otherChatRoomTextsLength.reduce((sum, num) => sum += num);
    const average = sum / otherChatRoomTextsLength.length;
    console.log('총개수: ', sum, '* 평균: ', average);

    const extractedAllTexts = extractOnlyTexts(data.chats);
    const userChatRoomTextsLength = extractedAllTexts.join('').length;
    console.log('* 우리 채팅방 총 텍스트 길이: ', userChatRoomTextsLength);

    const myRoomDeviation = userChatRoomTextsLength / average;
    const deviation = otherChatRoomTextsLength.map(textLen => textLen / average).sort();
    const userRanking = deviation.indexOf(myRoomDeviation) + 1;
    const totalTextLengthScore = 30 * (userRanking / deviation.length);

    console.log(`----- * 대화량 총점: ${totalTextLengthScore}/30`);

    const partnerTexts = [];
    const userTexts = data.chats.filter(chat => {
      if (chat.user_id !== req.user.id) {
        partnerTexts.push(chat);
      } else {
        return true;
      }
    });

    const extractedUserText = extractOnlyTexts(userTexts).join('');
    const extractedPartnerText = extractOnlyTexts(partnerTexts).join('');
    console.log('* 내가 보낸 텍스트 길이: ', extractedUserText.length);
    console.log('* 파트너가 보낸 텍스트 길이: ', extractedPartnerText.length);
    const calculateTextBalance = (userLen, partnerLen) => {
      const ratio = (userLen > partnerLen) ? partnerLen / userLen : userLen / partnerLen;
      return 30 * ratio;
    };
    const totalBalanceScore = calculateTextBalance(extractedUserText.length, extractedPartnerText.length);
    console.log(`----- * 대화 발란스 총점: ${totalBalanceScore}/30`);


    const document = {
      content: extractedAllTexts.join('. '),
      type: 'PLAIN_TEXT'
    };
    console.log(document);

    const result = textAnalysisSample;
    // const [ result ] = await client.analyzeSentiment({ document });

    const totalSentiment = result.documentSentiment.score;
    console.log('전체 감정 점수: ', totalSentiment);
    const totalSentimentScore = 20 + (totalSentiment * 20);
    const totalScore = totalTextLengthScore + totalBalanceScore + totalSentimentScore;
    console.log(`----- * 대화 감정 점수 총점: ${totalSentimentScore}/40`);
    console.log(`----- * 전체 총점: ${totalScore}/100`);
    const sortedSentences = result.sentences.sort((left, right) => right.sentiment.score - left.sentiment.score);
    // console.log(sortedSentences);

    const extractTexts = (words) => {
      return words.map(content => {
        const word = content.text.content;
        return word[word.length - 1] === '.' ? word.slice(0, word.length - 1) : word;
      });
    };

    const positiveTexts = extractTexts(sortedSentences.slice(0, 5));
    const negativeTexts = extractTexts(sortedSentences.slice(sortedSentences.length - 5, sortedSentences.length));

    console.log('* positive: ', positiveTexts);
    console.log('* negative: ', negativeTexts);
    const finalReport = {
      textAmount: {
        average,
        userRoom: userChatRoomTextsLength,
        score: totalTextLengthScore,
        perfectScore: 30
      },
      balance: {
        user: extractedUserText.length,
        partner: extractedPartnerText.length,
        score: totalBalanceScore,
        perfectScore: 30
      },
      sentiment: {
        score: totalSentimentScore,
        perfectScore: 40
      },
      totalScore,
      positiveTexts,
      negativeTexts,
      startDate,
      endDate
    };
    console.log(finalReport);
    /*
    console.log(JSON.stringify(result, null, 5));

    console.log(result);

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
    res.json({ result: 'ok', analysis_report: finalReport });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
