'use strict';
// Original question wording; factual sources reviewed 2026-09-28.
const sources = {
 scorers:'https://www.fifa.com/en/tournaments/mens/worldcup/articles/top-germany-goalscorers-history',
 madrid:'https://www.uefa.com/uefachampionsleague/news/0254-0d7cc63cf9b9-48509cbeb754-1000--club-facts-real-madrid/',
 final24:'https://www.uefa.com/uefachampionsleague/news/028d-1ad799ae4525-365c9c4d1986-1000--meet-the-2024-winners/',
 final08:'https://www.uefa.com/uefachampionsleague/news/01cf-0e6f71aacef6-834e3e001fd3-1000--fate-favours-triumphant-sir-alex/',
 world:'https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain'
};
const rows = [
 ['Top scorers','Who finished his men’s World Cup career with 16 goals?',['Miroslav Klose','Ronaldo','Lionel Messi','Gerd Müller'],0,'Klose scored 16 goals across four World Cups, from 2002 to 2014.','scorers'],
 ['Top scorers','How many men’s World Cup goals did Gerd Müller score?',['10','12','14','16'],2,'Gerd Müller scored 14 goals across the 1970 and 1974 tournaments.','scorers'],
 ['Club history','In which year was Real Madrid founded?',['1899','1902','1910','1920'],1,'The club was formed in 1902.','madrid'],
 ['Club history','How many European Cup / Champions League titles had Real Madrid won after the 2024 final?',['12','13','14','15'],3,'Their 2024 victory took their European Cup / Champions League total to 15.','final24'],
 ['Stadiums','Which stadium hosted the 2024 Champions League final?',['Wembley','San Siro','Luzhniki','Stade de France'],0,'Real Madrid defeated Borussia Dortmund at Wembley in London.','final24'],
 ['Stadiums','Which stadium hosted the 2008 Champions League final?',['Wembley','Luzhniki','Olympiastadion','San Siro'],1,'Manchester United and Chelsea contested the 2008 final at Moscow’s Luzhniki Stadium.','final08'],
 ['Managers','Who managed Real Madrid in their 2024 Champions League final victory?',['Zinedine Zidane','José Mourinho','Carlo Ancelotti','Rafael Benítez'],2,'Carlo Ancelotti led Madrid to their 2024 title.','final24'],
 ['Managers','Who managed Manchester United when they won the 2008 Champions League?',['David Moyes','José Mourinho','Louis van Gaal','Alex Ferguson'],3,'Alex Ferguson’s United won the final on penalties against Chelsea.','final08'],
 ['Champions','Which country won the 2022 men’s World Cup?',['Argentina','France','Brazil','Croatia'],0,'Argentina defeated France on penalties after a 3–3 draw.','world'],
 ['Champions','Which country won the 2014 men’s World Cup?',['Argentina','Spain','Germany','Netherlands'],2,'Germany defeated Argentina 1–0 after extra time.','world']
];
module.exports = rows.map(([category,text,options,correct,explanation,source],id)=>({id:String(id),category,text,options,correct,explanation,source:sources[source]}));
