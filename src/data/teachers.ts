export interface Teacher {
  id: string;
  name: string;
  role: string;
  crop: readonly [x: number, y: number, w: number, h: number];
}

export const STAFF_SHEET_WIDTH = 1920;
export const STAFF_SHEET_HEIGHT = 961;

export const TEACHERS: readonly Teacher[] = [
  { id: "aaron", name: "Aaron", role: "STEM / Specialist Team Leader", crop: [14, 18, 139, 148] },
  { id: "amila", name: "Amila", role: "5/6 Teacher", crop: [168, 18, 138, 148] },
  { id: "betty", name: "Betty", role: "Office Administration", crop: [322, 18, 138, 148] },
  { id: "blagma", name: "Blagma", role: "Foundation Teacher / Leading Teacher", crop: [476, 18, 138, 148] },
  { id: "caitlin", name: "Caitlin", role: "Inclusion Specialist", crop: [630, 18, 138, 148] },
  { id: "carmel", name: "Carmel", role: "Education Support", crop: [784, 18, 137, 148] },
  { id: "catherine", name: "Catherine", role: "5/6 Teacher", crop: [938, 18, 138, 148] },
  { id: "christie", name: "Christie", role: "Learning Enhancement", crop: [1091, 18, 138, 148] },
  { id: "emma", name: "Emma", role: "Principal", crop: [1246, 18, 138, 148] },
  { id: "frances", name: "Frances", role: "Foundation Teacher / Team Leader", crop: [1399, 18, 139, 148] },
  { id: "gabe", name: "Gabe", role: "Assistant Principal", crop: [1553, 18, 138, 148] },
  { id: "gareth", name: "Gareth", role: "Wellbeing", crop: [1707, 18, 138, 148] },

  { id: "georgia", name: "Georgia", role: "1/2 Teacher / Team Leader", crop: [14, 266, 139, 149] },
  { id: "jeanette", name: "Jeanette", role: "Foundation Teacher", crop: [168, 266, 138, 149] },
  { id: "jen", name: "Jen", role: "5/6 Teacher / Learning Specialist", crop: [322, 266, 138, 149] },
  { id: "karen", name: "Karen", role: "First Aid / OHS", crop: [476, 266, 138, 149] },
  { id: "kate", name: "Kate", role: "Performing Arts", crop: [630, 266, 138, 149] },
  { id: "kaye", name: "Kaye", role: "Education Support", crop: [784, 266, 138, 149] },
  { id: "kim", name: "Kim", role: "Education Support", crop: [938, 266, 137, 149] },
  { id: "laura", name: "Laura", role: "Foundation Teacher", crop: [1092, 266, 137, 149] },
  { id: "lauren-12", name: "Lauren (1/2)", role: "1/2 Teacher", crop: [1246, 266, 138, 149] },
  { id: "lauren-56", name: "Lauren (5/6)", role: "5/6 Teacher", crop: [1399, 266, 139, 149] },
  { id: "leila", name: "Leila", role: "Leading Teacher (Inclusion)", crop: [1553, 266, 138, 149] },
  { id: "lizzie", name: "Lizzie", role: "3/4 Teacher", crop: [1707, 266, 138, 149] },

  { id: "louie", name: "Louie", role: "Education Support", crop: [14, 515, 139, 149] },
  { id: "louise-12", name: "Louise (1/2)", role: "1/2 Teacher", crop: [168, 515, 138, 149] },
  { id: "louise-finance", name: "Louise (Finance)", role: "Finance Assistant", crop: [322, 515, 138, 149] },
  { id: "lucy", name: "Lucy", role: "3/4 Teacher", crop: [476, 515, 138, 149] },
  { id: "matthew", name: "Matthew", role: "Inclusion Specialist", crop: [630, 515, 138, 149] },
  { id: "max", name: "Max", role: "PE", crop: [784, 515, 138, 149] },
  { id: "melanie", name: "Melanie", role: "Business Manager", crop: [938, 515, 138, 149] },
  { id: "mike", name: "Mike", role: "Foundation Teacher", crop: [1092, 515, 137, 149] },
  { id: "monica", name: "Monica", role: "Visual Art", crop: [1246, 515, 138, 149] },
  { id: "myffy", name: "Myffy", role: "1/2 Teacher", crop: [1399, 515, 139, 149] },
  { id: "nikki", name: "Nikki", role: "5/6 Teacher", crop: [1554, 515, 137, 149] },
  { id: "oliver", name: "Oliver", role: "3/4 Teacher", crop: [1707, 515, 138, 149] },

  { id: "paul", name: "Paul", role: "1/2 Teacher", crop: [92, 735, 137, 150] },
  { id: "rosemary", name: "Rosemary", role: "5/6 Teacher / Team Leader", crop: [246, 735, 137, 150] },
  { id: "russell", name: "Russell", role: "Maintenance and Grounds", crop: [399, 735, 139, 150] },
  { id: "sam", name: "Sam", role: "3/4 Teacher / Leading Teacher", crop: [553, 735, 138, 150] },
  { id: "sarah", name: "Sarah", role: "5/6 Teacher", crop: [707, 735, 138, 150] },
  { id: "seth", name: "Seth", role: "Technical Support", crop: [861, 735, 138, 150] },
  { id: "stuart", name: "Stuart", role: "3/4 Teacher / Team Leader", crop: [1014, 735, 139, 150] },
  { id: "susan", name: "Susan", role: "1/2 Teacher", crop: [1169, 735, 137, 150] },
  { id: "susan-p", name: "Susan P", role: "3/4 Teacher", crop: [1322, 735, 138, 150] },
  { id: "tara", name: "Tara", role: "Education Support", crop: [1476, 735, 138, 150] },
  { id: "trish", name: "Trish", role: "Education Support", crop: [1630, 735, 139, 150] },
];

export function getTeacherById(id: string | null | undefined): Teacher | undefined {
  if (!id) return undefined;
  return TEACHERS.find((t) => t.id === id);
}

export function getRandomTeacher(): Teacher {
  const idx = Math.floor(Math.random() * TEACHERS.length);
  return TEACHERS[idx] ?? TEACHERS[0]!;
}