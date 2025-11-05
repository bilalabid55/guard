const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Site = require('./models/Site');
const AccessPoint = require('./models/AccessPoint');
const Visitor = require('./models/Visitor');
const BannedVisitor = require('./models/BannedVisitor');
const Incident = require('./models/Incident');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acsoguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Site.deleteMany({});
    await AccessPoint.deleteMany({});
    await Visitor.deleteMany({});
    await BannedVisitor.deleteMany({});
    await Incident.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const admin = new User({
      fullName: 'John Admin',
      email: 'admin@acsoguard.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1-555-0001',
      address: '123 Admin Street, City, State 12345',
      isActive: true
    });
    await admin.save();
    console.log('👤 Created admin user');

    // Create Site
    const site = new Site({
      name: 'Downtown Construction Site',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      admin: admin._id,
      contactInfo: {
        phone: '+1-555-0100',
        email: 'site@downtownconstruction.com',
        emergencyPhone: '+1-555-9111'
      },
      settings: {
        allowPreRegistration: true,
        requirePPE: true,
        requireSafetyInduction: true,
        maxVisitorsPerDay: 100,
        visitorBadgeExpiryHours: 8,
        emergencyContacts: [
          {
            name: 'Site Manager',
            phone: '+1-555-0101',
            email: 'manager@site.com',
            role: 'Emergency Coordinator'
          },
          {
            name: 'Security Chief',
            phone: '+1-555-0102',
            email: 'security@site.com',
            role: 'Security'
          }
        ],
        termsAndConditions: 'By entering this construction site, you agree to follow all safety protocols and regulations. Hard hats and safety vests are required at all times.'
      },
      subscription: {
        status: 'active',
        plan: 'premium',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });
    await site.save();
    console.log('🏗️  Created site');

    // Create Site Manager
    const siteManager = new User({
      fullName: 'Sarah Manager',
      email: 'manager@acsoguard.com',
      password: 'manager123',
      role: 'site_manager',
      assignedSite: site._id,
      phone: '+1-555-0101',
      address: '456 Manager Ave, City, State 12345',
      isActive: true
    });
    await siteManager.save();
    console.log('👤 Created site manager');

    // Create Security Guards
    const securityGuard1 = new User({
      fullName: 'Mike Security',
      email: 'security1@acsoguard.com',
      password: 'security123',
      role: 'security_guard',
      assignedSite: site._id,
      phone: '+1-555-0102',
      address: '789 Security St, City, State 12345',
      isActive: true
    });
    await securityGuard1.save();

    const securityGuard2 = new User({
      fullName: 'Lisa Guard',
      email: 'security2@acsoguard.com',
      password: 'security123',
      role: 'security_guard',
      assignedSite: site._id,
      phone: '+1-555-0103',
      address: '321 Guard Blvd, City, State 12345',
      isActive: true
    });
    await securityGuard2.save();
    console.log('👤 Created security guards');

    // Create Receptionist
    const receptionist = new User({
      fullName: 'Emma Reception',
      email: 'reception@acsoguard.com',
      password: 'reception123',
      role: 'receptionist',
      assignedSite: site._id,
      phone: '+1-555-0104',
      address: '654 Reception Rd, City, State 12345',
      isActive: true
    });
    await receptionist.save();
    console.log('👤 Created receptionist');

    // Update site with staff
    site.siteManagers.push(siteManager._id);
    site.securityGuards.push(securityGuard1._id, securityGuard2._id);
    site.receptionists.push(receptionist._id);
    await site.save();

    // Create Access Points
    const mainGate = new AccessPoint({
      name: 'Main Gate',
      site: site._id,
      type: 'main_gate',
      location: {
        building: 'Main Building',
        floor: 'Ground Floor'
      },
      accessLevel: 'public',
      requiredPPE: ['hard_hat', 'safety_vest', 'safety_shoes'],
      operatingHours: {
        start: '06:00',
        end: '18:00',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      assignedStaff: [securityGuard1._id],
      capacity: 50,
      description: 'Primary entrance for all visitors'
    });
    await mainGate.save();

    const sideEntrance = new AccessPoint({
      name: 'Side Entrance',
      site: site._id,
      type: 'side_entrance',
      location: {
        building: 'Side Building',
        floor: 'Ground Floor'
      },
      accessLevel: 'public',
      requiredPPE: ['hard_hat', 'safety_vest'],
      operatingHours: {
        start: '07:00',
        end: '17:00',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      assignedStaff: [securityGuard2._id],
      capacity: 30,
      description: 'Secondary entrance for contractors'
    });
    await sideEntrance.save();

    const loadingDock = new AccessPoint({
      name: 'Loading Dock',
      site: site._id,
      type: 'loading_dock',
      location: {
        building: 'Warehouse',
        floor: 'Ground Floor'
      },
      accessLevel: 'restricted',
      requiredPPE: ['hard_hat', 'safety_vest', 'safety_shoes', 'gloves'],
      operatingHours: {
        start: '08:00',
        end: '16:00',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      assignedStaff: [securityGuard1._id, securityGuard2._id],
      capacity: 20,
      description: 'Restricted area for deliveries'
    });
    await loadingDock.save();
    console.log('🚪 Created access points');

    // Create Sample Visitors
    const visitors = [
      {
        fullName: 'John Smith',
        email: 'john.smith@abcconstruction.com',
        phone: '+1-555-1001',
        company: 'ABC Construction Inc',
        purpose: 'Site inspection and safety review',
        contactPerson: 'Sarah Manager',
        host: {
          name: 'Mike Johnson',
          email: 'mike@site.com',
          phone: '+1-555-2001',
          department: 'Safety'
        },
        accessPoint: mainGate._id,
        site: site._id,
        checkedInBy: securityGuard1._id,
        checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expectedDuration: 4,
        specialAccess: 'none',
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+1-555-1002',
          relationship: 'Spouse'
        },
        ppeVerified: true,
        safetyInductionCompleted: true,
        safetyInductionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'checked_in'
      },
      {
        fullName: 'Lisa Brown',
        email: 'lisa.brown@xyzengineering.com',
        phone: '+1-555-1003',
        company: 'XYZ Engineering',
        purpose: 'Equipment delivery and installation',
        contactPerson: 'Tom Wilson',
        host: {
          name: 'David Lee',
          email: 'david@site.com',
          phone: '+1-555-2002',
          department: 'Operations'
        },
        accessPoint: loadingDock._id,
        site: site._id,
        checkedInBy: securityGuard2._id,
        checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        expectedDuration: 6,
        specialAccess: 'contractor',
        emergencyContact: {
          name: 'Robert Brown',
          phone: '+1-555-1004',
          relationship: 'Brother'
        },
        ppeVerified: true,
        safetyInductionCompleted: true,
        safetyInductionDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'checked_in'
      },
      {
        fullName: 'Mike Davis',
        email: 'mike.davis@safetyfirst.com',
        phone: '+1-555-1005',
        company: 'Safety First Corp',
        purpose: 'Safety audit and compliance check',
        contactPerson: 'Sarah Manager',
        host: {
          name: 'Sarah Manager',
          email: 'manager@site.com',
          phone: '+1-555-0101',
          department: 'Management'
        },
        accessPoint: mainGate._id,
        site: site._id,
        checkedInBy: securityGuard1._id,
        checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        checkOutTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        expectedDuration: 2,
        specialAccess: 'auditor',
        emergencyContact: {
          name: 'Susan Davis',
          phone: '+1-555-1006',
          relationship: 'Wife'
        },
        ppeVerified: true,
        safetyInductionCompleted: true,
        safetyInductionDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        status: 'checked_out',
        checkedOutBy: securityGuard1._id
      },
      {
        fullName: 'Jennifer Wilson',
        email: 'jennifer.wilson@buildright.com',
        phone: '+1-555-1007',
        company: 'BuildRight Solutions',
        purpose: 'Material delivery and quality inspection',
        contactPerson: 'Mike Johnson',
        host: {
          name: 'Mike Johnson',
          email: 'mike@site.com',
          phone: '+1-555-2001',
          department: 'Procurement'
        },
        accessPoint: sideEntrance._id,
        site: site._id,
        checkedInBy: securityGuard2._id,
        checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        expectedDuration: 3,
        specialAccess: 'none',
        emergencyContact: {
          name: 'Mark Wilson',
          phone: '+1-555-1008',
          relationship: 'Husband'
        },
        ppeVerified: true,
        safetyInductionCompleted: true,
        safetyInductionDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
        status: 'overstayed'
      }
    ];

    for (const visitorData of visitors) {
      const visitor = new Visitor(visitorData);
      await visitor.save();
    }
    console.log('👥 Created sample visitors');

    // Create Banned Visitors
    const bannedVisitors = [
      {
        fullName: 'Robert Johnson',
        email: 'robert.johnson@banned.com',
        phone: '+1-555-2001',
        company: 'Problematic Construction',
        reason: 'Safety Violations - Repeated failure to wear PPE',
        description: 'Multiple incidents of not wearing hard hat and safety vest despite warnings',
        site: site._id,
        bannedBy: siteManager._id,
        bannedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isActive: true,
        incidentReport: 'Visitor repeatedly ignored safety protocols and was verbally abusive to security staff'
      },
      {
        fullName: 'David Miller',
        email: 'david.miller@unauthorized.com',
        phone: '+1-555-2002',
        company: 'Unauthorized Access Inc',
        reason: 'Unauthorized Access - Attempted to enter restricted areas',
        description: 'Attempted to access construction zones without proper authorization',
        site: site._id,
        bannedBy: securityGuard1._id,
        bannedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isActive: true,
        incidentReport: 'Visitor was found in restricted construction zone without proper clearance'
      }
    ];

    for (const bannedData of bannedVisitors) {
      const bannedVisitor = new BannedVisitor(bannedData);
      await bannedVisitor.save();
    }
    console.log('🚫 Created banned visitors');

    // Create Incidents
    const incidents = [
      {
        title: 'Safety Incident - Slip and Fall',
        description: 'Visitor slipped on wet surface near main entrance due to inadequate signage',
        type: 'safety',
        severity: 'medium',
        site: site._id,
        reportedBy: securityGuard1._id,
        incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        location: {
          accessPoint: mainGate._id,
          building: 'Main Building',
          floor: 'Ground Floor',
          specificLocation: 'Main entrance lobby'
        },
        peopleInvolved: [
          {
            name: 'John Smith',
            role: 'visitor',
            company: 'ABC Construction Inc',
            contactInfo: {
              phone: '+1-555-1001',
              email: 'john.smith@abcconstruction.com'
            },
            isInjured: true,
            injuryDescription: 'Minor bruising on left arm'
          }
        ],
        witnesses: [
          {
            name: 'Mike Security',
            contactInfo: {
              phone: '+1-555-0102',
              email: 'security1@acsoguard.com'
            },
            statement: 'Visitor was walking quickly and slipped on the wet floor near the entrance'
          }
        ],
        status: 'investigating',
        investigation: {
          assignedTo: siteManager._id,
          startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          findings: 'Inadequate signage and floor cleaning procedures',
          recommendations: 'Install warning signs and improve floor cleaning schedule'
        }
      },
      {
        title: 'Security Breach - Unauthorized Access',
        description: 'Individual attempted to access restricted construction zone without authorization',
        type: 'security',
        severity: 'high',
        site: site._id,
        reportedBy: securityGuard2._id,
        incidentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        location: {
          accessPoint: loadingDock._id,
          building: 'Warehouse',
          floor: 'Ground Floor',
          specificLocation: 'Loading dock area'
        },
        peopleInvolved: [
          {
            name: 'David Miller',
            role: 'visitor',
            company: 'Unauthorized Access Inc',
            contactInfo: {
              phone: '+1-555-2002',
              email: 'david.miller@unauthorized.com'
            },
            isInjured: false
          }
        ],
        witnesses: [
          {
            name: 'Lisa Guard',
            contactInfo: {
              phone: '+1-555-0103',
              email: 'security2@acsoguard.com'
            },
            statement: 'Individual was found in restricted area and was escorted out immediately'
          }
        ],
        status: 'resolved',
        resolution: {
          resolvedBy: siteManager._id,
          resolvedDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          resolutionNotes: 'Individual was banned from site and incident was reported to authorities',
          lessonsLearned: 'Need to improve access control and monitoring of restricted areas'
        }
      }
    ];

    for (const incidentData of incidents) {
      const incident = new Incident(incidentData);
      await incident.save();
    }
    console.log('📋 Created incidents');

    // Update access point occupancy
    await mainGate.updateOccupancy();
    await sideEntrance.updateOccupancy();
    await loadingDock.updateOccupancy();

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`🏗️  Sites: ${await Site.countDocuments()}`);
    console.log(`🚪 Access Points: ${await AccessPoint.countDocuments()}`);
    console.log(`👥 Visitors: ${await Visitor.countDocuments()}`);
    console.log(`🚫 Banned Visitors: ${await BannedVisitor.countDocuments()}`);
    console.log(`📋 Incidents: ${await Incident.countDocuments()}`);

    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@acsoguard.com / admin123');
    console.log('Site Manager: manager@acsoguard.com / manager123');
    console.log('Security Guard: security1@acsoguard.com / security123');
    console.log('Receptionist: reception@acsoguard.com / reception123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();

