import { NextResponse } from 'next/server';

const USERS = [
  {
    id: 1,
    name: 'Dr. Rajesh Rao (Canteen Director)',
    email: 'admin@canteen.pes.edu',
    password: 'pesu@123',
    role: 'ADMIN',
  },
  {
    id: 2,
    name: 'Ramesh Kumar (Canteen Lead)',
    email: 'staff.ramesh@canteen.pes.edu',
    password: 'pesu@123',
    role: 'STAFF',
  },
  {
    id: 3,
    name: 'Aarav Sharma (Student)',
    email: 'student.aarav@pes.edu',
    password: '',
    role: 'STUDENT',
  },
];

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    let user = null;
    if (role) {
      user = USERS.find(u => u.role === role);
    } else if (email) {
      user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid user or role selected.' }, { status: 401 });
    }

    // Pass protection: ADMIN and STAFF require password "pesu@123"
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      if (!password || password !== 'pesu@123') {
        return NextResponse.json(
          { error: `Incorrect password for ${user.role}. Password protection requires "pesu@123".` },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
