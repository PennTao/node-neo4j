import requests
import json
import time
from faker import Factory

faker = Factory.create()
url = 'http://localhost:3000/users';
headers = {'content-type': 'application/json'}

totalTime = 0;
for i in range(1,10000):
    payload = {'name':faker.name(),'email':faker.email(),'address':faker.address()}
  #  t0 = time.time()
    requests.post(url, data=json.dumps(payload), headers=headers)
   # totalTime = totalTime + (time.time() - t0)
   # print i
#print totalTime
