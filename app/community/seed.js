import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const fakePosts = [
  {
    username: 'alex_codes',
    profilePic: '',
    caption: 'Why is my loop running one extra time? I keep getting an off-by-one error 😭',
    code: `for (int i = 0; i <= arr.length; i++) {
  cout << arr[i] << endl;
}`,
    language: 'C++',
    likes: 4,
    createdAt: new Date(),
    isAI: true,
  },
  {
    username: 'priya_dev',
    profilePic: '',
    caption: 'Can someone explain why my recursive function hits a stack overflow? It works for small inputs but crashes on large ones',
    code: `def fibonacci(n):
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(100))`,
    language: 'Python',
    likes: 7,
    createdAt: new Date(),
    isAI: true,
  },
  {
    username: 'jasonlearns',
    profilePic: '',
    caption: 'Finally got my first linked list working!! Took me 3 days lol. Any tips on how to make it better?',
    code: `class Node {
  int data;
  Node next;
  Node(int d) { data = d; }
}

class LinkedList {
  Node head;
  void insert(int data) {
    Node newNode = new Node(data);
    newNode.next = head;
    head = newNode;
  }
}`,
    language: 'Java',
    likes: 12,
    createdAt: new Date(),
    isAI: true,
  },
  {
    username: 'sara.tech',
    profilePic: '',
    caption: 'Is there a cleaner way to do this? It works but feels messy',
    code: `if (x == 1) {
  console.log("one");
} else if (x == 2) {
  console.log("two");
} else if (x == 3) {
  console.log("three");
} else if (x == 4) {
  console.log("four");
}`,
    language: 'JavaScript',
    likes: 9,
    createdAt: new Date(),
    isAI: true,
  },
  {
    username: 'mike_freshman',
    profilePic: '',
    caption: 'Getting a segfault and I have no idea why. Please help 😅',
    code: `int* ptr = nullptr;
*ptr = 42;
cout << *ptr << endl;`,
    language: 'C++',
    likes: 3,
    createdAt: new Date(),
    isAI: true,
  },
];

export const seedPosts = async () => {
  for (const post of fakePosts) {
    await addDoc(collection(db, 'communityPosts'), post);
  }
  console.log('Seeded!');
};