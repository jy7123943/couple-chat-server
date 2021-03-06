const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../model/User');
const ChatRoom = require('../model/ChatRoom');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();

router.get('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const chatRoom = await ChatRoom.findById(req.user.chatroom_id);

      if (!chatRoom) {
        return res.json({ error: '채팅 기록이 없습니다.' });
      }

      return res.json({ chats: chatRoom.chats });
    } catch (err) {
      console.log(err);
      next(err);
    }
});

router.post('/analysis',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const DAYS_AGO = 30;
      const endDate = new Date();
      const startDate = new Date(endDate - (3600000 * 24 * DAYS_AGO));

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

      const sum = otherChatRoomTextsLength.reduce((sum, num) => sum += num);
      const average = sum / otherChatRoomTextsLength.length;

      const extractedAllTexts = extractOnlyTexts(data.chats);
      const userChatRoomTextsLength = extractedAllTexts.join('').length;

      const myRoomDeviation = userChatRoomTextsLength / average;
      const deviation = otherChatRoomTextsLength.map(textLen => textLen / average).sort();
      const userRanking = deviation.indexOf(myRoomDeviation) + 1;
      const totalTextLengthScore = 20 * (userRanking / deviation.length);

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

      const calculateTextBalance = (userLen, partnerLen) => {
        const ratio = (userLen > partnerLen) ? partnerLen / userLen : userLen / partnerLen;
        return 20 * ratio;
      };

      const totalBalanceScore = calculateTextBalance(extractedUserText.length, extractedPartnerText.length);

      const document = {
        content: extractedAllTexts.join('. '),
        type: 'PLAIN_TEXT'
      };

      const [ result ] = await client.analyzeSentiment({ document });

      const totalSentiment = result.documentSentiment.score;
      const totalSentimentScore = 30 + (totalSentiment * 30);
      const totalScore = totalTextLengthScore + totalBalanceScore + totalSentimentScore;

      const sortedSentences = result.sentences.sort((left, right) => right.sentiment.score - left.sentiment.score);

      const extractTexts = (words) => {
        return words.map(content => {
          const word = content.text.content;
          return word[word.length - 1] === '.' ? word.slice(0, word.length - 1) : word;
        });
      };

      const positiveTexts = extractTexts(sortedSentences.slice(0, 10));
      const negativeTexts = extractTexts(sortedSentences.slice(sortedSentences.length - 10, sortedSentences.length)).reverse();

      const finalReport = {
        textAmount: {
          average,
          userRoom: userChatRoomTextsLength,
          score: totalTextLengthScore,
          perfectScore: 20
        },
        balance: {
          user: extractedUserText.length,
          partner: extractedPartnerText.length,
          score: totalBalanceScore,
          perfectScore: 20
        },
        sentiment: {
          score: totalSentimentScore,
          perfectScore: 60
        },
        totalScore,
        positiveTexts,
        negativeTexts,
        startDate,
        endDate
      };
      console.log(finalReport);

      res.json({ result: 'ok', analysis_report: finalReport });
    } catch (err) {
      console.log(err);
      next(err);
    }
});

module.exports = router;
