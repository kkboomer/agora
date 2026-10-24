export interface Review {
  id: string;
  itemId: string;
  user: string;
  color: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  when: string;
  likes: number;
}

// Mock reviews until these come from the Supabase `reviews` table.
export const REVIEWS: Review[] = [
  { id: 'c1', itemId: 'atelier-signature-coat', user: 'mayawears', color: '#aa7058', rating: 5, text: 'Heavier than it looks in the photos in the best way. Wore it all week and got asked about it three times.', when: '2d', likes: 42 },
  { id: 'c2', itemId: 'atelier-signature-coat', user: 'alexm', color: '#647277', rating: 4, text: 'Beautiful oatmeal color and the drape is perfect. Runs a little big so I sized down.', when: '4d', likes: 18 },
  { id: 'c3', itemId: 'atelier-signature-coat', user: 'sofiar', color: '#82715f', rating: 5, text: 'Okay this is the coat. Warm without being bulky, and it goes over literally everything.', when: '1w', likes: 63 },
  { id: 'c4', itemId: 'atelier-signature-coat', user: 'noahw', color: '#6e7562', rating: 3, text: 'Nice quality but the sleeves are long on me. Tailoring needed, otherwise love it.', when: '1w', likes: 7 },
  { id: 'c5', itemId: 'atelier-signature-coat', user: 'camillep', color: '#9a6d72', rating: 5, text: 'Bought it for the fall and it already feels like a staple. The pockets are actually deep!', when: '2w', likes: 29 },
  { id: 'c6', itemId: 'atelier-signature-coat', user: 'jules_b', color: '#5f7a6c', rating: 4, text: 'Color is a touch lighter in person. Still gorgeous and the wool feels premium.', when: '3w', likes: 11 },
  { id: 'c7', itemId: 'atelier-signature-coat', user: 'theo.k', color: '#8a6e8f', rating: 2, text: 'Pretty, but it wrinkles easily and arrived creased. Steaming fixed it though.', when: '3w', likes: 4 },
  { id: 'c8', itemId: 'atelier-signature-coat', user: 'priya.s', color: '#b07f4f', rating: 5, text: 'Worth every penny. Got the long length and it hits right at the calf.', when: '1mo', likes: 21 },

  { id: 'j1', itemId: 'lewkin-nayela-jeans', user: 'mayawears', color: '#aa7058', rating: 5, text: 'The wash is so good IRL. Super baggy and low without falling off. Fits true to size.', when: '1d', likes: 57 },
  { id: 'j2', itemId: 'lewkin-nayela-jeans', user: 'sofiar', color: '#82715f', rating: 4, text: 'Love the vintage fade. I hemmed mine since I’m 5′3″, the length is really long.', when: '3d', likes: 24 },
  { id: 'j3', itemId: 'lewkin-nayela-jeans', user: 'camillep', color: '#9a6d72', rating: 5, text: 'Wearing these with a baby tee and sneakers every weekend. The denim is thick but not stiff.', when: '5d', likes: 38 },
  { id: 'j4', itemId: 'lewkin-nayela-jeans', user: 'jules_b', color: '#5f7a6c', rating: 3, text: 'Cute but a bit loose in the waist for me. A belt fixes it.', when: '1w', likes: 6 },
  { id: 'j5', itemId: 'lewkin-nayela-jeans', user: 'priya.s', color: '#b07f4f', rating: 5, text: 'Finally wide leg jeans that don’t look like a costume. Pockets are real and deep.', when: '1w', likes: 31 },
  { id: 'j6', itemId: 'lewkin-nayela-jeans', user: 'alexm', color: '#647277', rating: 4, text: 'Got the regular length. The wash is slightly more green than the photos, I like it.', when: '2w', likes: 9 },
  { id: 'j7', itemId: 'lewkin-nayela-jeans', user: 'theo.k', color: '#8a6e8f', rating: 1, text: 'Zipper snagged on the first wear. Support was quick to help, though.', when: '2w', likes: 3 },
  { id: 'j8', itemId: 'lewkin-nayela-jeans', user: 'noahw', color: '#6e7562', rating: 5, text: 'Bought these for my girlfriend and she hasn’t taken them off. Obsessed.', when: '1mo', likes: 15 },
];

export const reviewsFor = (itemId: string, source: Review[] = REVIEWS) => source.filter((r) => r.itemId === itemId);

export const averageRating = (reviews: Review[]) =>
  reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
