import requests
import json
from random import randrange

headers = {'content-type': 'application/json'}
for i in range(1,2):
	userA = randrange(18923, 555295);
	userB = randrange(18923, 555295);
	payload = {'user':{'id':str(userB)}};
	url = 'http://localhost:3000/users/' + str(userA) + '/path';
	requests.post(url, data=json.dumps(payload), headers=headers)
