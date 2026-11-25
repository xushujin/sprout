// Remaining vocabulary is generated four words per request. The API bills per
// request, so a 2x2 sheet keeps the set affordable while still giving each word
// a 512px cell (plenty for the 94px quiz tile). The first two groups close the
// grade-one gaps left by the individual pass.
export const GRID_GROUPS = [
  // Grade-one gaps that the individual pass could not finish.
  ['sad', 'hi', 'please', 'he'],
  ['we', 'that', 'here', 'bye'],
  ['face', 'hair', 'eye', 'ear'],
  ['nose', 'mouth', 'hand', 'foot'],
  ['head', 'arm', 'leg', 'body'],
  ['pen', 'eraser', 'desk', 'chair'],
  ['door', 'window', 'school', 'classroom'],
  ['teacher', 'friend', 'student', 'classmate'],
  ['schoolbag', 'crayon', 'map', 'picture'],
  ['cap', 'coat', 'dress', 'skirt'],
  ['shorts', 'trousers', 'sock', 'sweater'],
  ['umbrella', 'house', 'home', 'bed'],
  ['room', 'bedroom', 'bathroom', 'kitchen'],
  ['table', 'sofa', 'light', 'rice'],
  ['noodles', 'tomato', 'potato', 'carrot'],
  ['watermelon', 'strawberry', 'breakfast', 'lunch'],
  ['dinner', 'bee', 'ant', 'frog'],
  ['snake', 'mouse', 'butterfly', 'penguin'],
  ['goat', 'deer', 'wolf', 'sunny'],
  ['cloudy', 'windy', 'rainy', 'spring'],
  ['summer', 'autumn', 'winter', 'warm'],
  ['cool', 'old', 'young', 'new'],
  ['clean', 'dirty', 'fat', 'thin'],
  ['strong', 'quiet', 'fast', 'walk'],
  ['ride', 'swim', 'fly', 'sleep'],
  ['listen', 'speak', 'sit', 'stand'],
  ['open', 'yes', 'no', 'ok'],
];
