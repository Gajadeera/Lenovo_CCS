const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/config');
const {
    User,
    Customer,
    Device,
    Job,
    JobUpdate,
    PartsRequest,
    ActivityLog,
    SystemIssue
} = require('./models');

mongoose.connect(config.mongoose.url, config.mongoose.options)
    .then(() => console.log('Connected to MongoDB for seeding'))
    .catch(err => console.error('MongoDB connection error:', err));

const createAttachment = (type, name, uploadedBy) => ({
    url: `https://res.cloudinary.com/demo/${type === 'image' ? 'image' : 'raw'}/upload/v1626282931/sample.${type === 'image' ? 'jpg' : 'pdf'}`,
    public_id: `sample_${type}_public_id` + Math.random().toString(36).substring(7),
    type,
    name: name || `sample_${type === 'image' ? 'photo' : 'document'}`,
    uploaded_at: new Date(),
    uploaded_by: uploadedBy
});

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const jobTypes = ['workshop', 'onsite', 'remote'];
const jobStatuses = [
    'Pending Assignment',
    'Assigned',
    'In Progress',
    'On Hold',
    'Awaiting Workshop Repair',
    'Closed',
    'Reopened'
];
const warrantyStatuses = ['In Warranty', 'Out of Warranty'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const deviceTypes = ["Laptop", "Desktop", "Server", "Printer", "Tablet", "Workstation", "All-in-One"];
const issueCategories = ["Bug", "Feature Request", "UI/UX", "Performance", "Other"];
const issueStatuses = ["Open", "In Progress", "Resolved", "Closed"];
const issuePriorities = ["Low", "Medium", "High"];

const createActivityLog = (user, action, entityType, entityId, details = {}) => ({
    user_id: user._id,
    user_name: user.name,
    user_role: user.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: new Date()
});

const seedDB = async () => {
    try {
        await mongoose.connection.dropDatabase();
        const activityLogs = [];

        // Define all users (10 total)
        const allUsers = [
            // Admin and management
            {
                name: "Admin User",
                email: "admin@lenovo-ccs.com",
                phone: "0712345678",
                password: 'Admin@123',
                role: "administrator",
                skill: [
                    { name: "Network Administration", subskills: ["User Management", "Security Configuration"] },
                    { name: "System Management", subskills: ["Server Maintenance", "Backup Management"] }
                ]
            },
            {
                name: "Service Manager",
                email: "manager@lenovo-ccs.com",
                phone: "0723456789",
                password: 'Manager@123',
                role: "manager",
                skill: [
                    { name: "Team Management", subskills: ["Work Allocation", "Performance Review"] },
                    { name: "Operations", subskills: ["Process Optimization", "Resource Planning"] }
                ]
            },

            // Coordinators
            {
                name: "Service Coordinator",
                email: "coordinator@lenovo-ccs.com",
                phone: "0734567890",
                password: 'Coord@123',
                role: "coordinator",
                skill: [
                    { name: "Coordination", subskills: ["Service Scheduling", "Customer Communication"] },
                    { name: "Documentation", subskills: ["Service Reports", "Record Keeping"] }
                ]
            },
            {
                name: "Customer Support",
                email: "support@lenovo-ccs.com",
                phone: "0778901234",
                password: 'Coord@123',
                role: "coordinator",
                skill: [
                    { name: "Customer Service", subskills: ["Issue Triage", "Service Coordination"] },
                    { name: "Communication", subskills: ["Client Updates", "Feedback Collection"] }
                ]
            },

            // Parts team
            {
                name: "Parts Manager",
                email: "parts.manager@lenovo-ccs.com",
                phone: "0767890123",
                password: 'Parts@123',
                role: "parts_team",
                skill: [
                    { name: "Inventory Management", subskills: ["Stock Control", "Order Processing"] },
                    { name: "Logistics", subskills: ["Parts Dispatch", "Supplier Coordination"] }
                ]
            },

            // Technicians (5 technicians)
            {
                name: "Kamal Silva",
                phone: "0711234567",
                email: "kamal.silva@techsupport.com",
                password: "Password123!",
                role: "technician",
                skill: [
                    {
                        name: "Hardware",
                        subskills: ["Motherboard Repair", "RAM Replacement", "HDD/SSD Installation", "Power Supply", "Laptop Disassembly"]
                    },
                    {
                        name: "Printer",
                        subskills: ["Inkjet Printers", "Laser Printers", "Paper Jam Resolution", "Toner Replacement", "Network Printing"]
                    }
                ]
            },
            {
                name: "Nimal Perera",
                phone: "0722345678",
                email: "nimal.perera@techsupport.com",
                password: "Password123!",
                role: "technician",
                skill: [
                    {
                        name: "Software",
                        subskills: ["Windows Installation", "Driver Installation", "Antivirus Setup", "Office Applications", "OS Troubleshooting"]
                    },
                    {
                        name: "Server",
                        subskills: ["Windows Server", "Active Directory", "DNS Configuration", "DHCP Setup", "File Sharing"]
                    }
                ]
            },
            {
                name: "Sunil Fernando",
                phone: "0733456789",
                email: "sunil.fernando@techsupport.com",
                password: "Password123!",
                role: "technician",
                skill: [
                    {
                        name: "Electronics",
                        subskills: ["Circuit Board Repair", "Soldering", "Power Management", "Component Testing", "PCB Diagnostics"]
                    },
                    {
                        name: "Hardware",
                        subskills: ["Desktop Assembly", "Cooling Systems", "Graphics Cards", "Peripheral Setup", "BIOS Configuration"]
                    }
                ]
            },
            {
                name: "Rajesh Kumar",
                phone: "0744567890",
                email: "rajesh.kumar@techsupport.com",
                password: "Password123!",
                role: "technician",
                skill: [
                    {
                        name: "Server",
                        subskills: ["Linux Server", "Apache Configuration", "MySQL Database", "Network Security", "Backup Systems"]
                    },
                    {
                        name: "Software",
                        subskills: ["Linux OS", "Shell Scripting", "Database Management", "Web Servers", "Security Patches"]
                    }
                ]
            },
            {
                name: "Priya Bandara",
                phone: "0755678901",
                email: "priya.bandara@techsupport.com",
                password: "Password123!",
                role: "technician",
                skill: [
                    {
                        name: "Printer",
                        subskills: ["Multifunction Printers", "Scanner Repair", "Wireless Printing", "Printer Drivers", "Color Calibration"]
                    },
                    {
                        name: "Software",
                        subskills: ["Network Configuration", "Wireless Setup", "Email Configuration", "Mobile Printing", "Cloud Printing"]
                    }
                ]
            }
        ];

        // Hash passwords and insert all users
        const hashedUsers = await Promise.all(allUsers.map(async u => ({
            ...u,
            password: await bcrypt.hash(u.password, 10)
        })));

        const users = await User.insertMany(hashedUsers);
        console.log(`✅ Inserted ${users.length} users`);

        // Log user creation
        users.forEach(user => {
            activityLogs.push(createActivityLog(user, 'create', 'user', user._id));
        });

        // Customers - 5 records
        const customers = await Customer.insertMany([
            { name: "ABC Corporation", phone: "0111223344", email: "contact@abccorp.com", address: "123 Main Street, Colombo 01", customer_type: "Enterprise", is_ad_hoc: false },
            { name: "XYZ Bank PLC", phone: "0111333444", email: "it@xyzbank.lk", address: "456 Commercial Ave, Colombo 02", customer_type: "Enterprise", is_ad_hoc: false },
            { name: "John Perera", phone: "0777123456", email: "john.perera@gmail.com", address: "78 Flower Road, Colombo 07", customer_type: "Personal", is_ad_hoc: false },
            { name: "GHI Hospital", phone: "0112365987", email: "it@ghihospital.lk", address: "34 Hospital Lane, Colombo 05", customer_type: "Enterprise", is_ad_hoc: false },
            { name: "Walk-in Customer", phone: "0777123999", email: "walkin@temp.com", address: "Colombo", customer_type: "Personal", is_ad_hoc: true }
        ]);
        console.log(`✅ Inserted ${customers.length} customers`);

        // Log customer creation
        customers.forEach(customer => {
            const creator = getRandomItem(users.filter(u => ['administrator', 'manager', 'coordinator'].includes(u.role)));
            activityLogs.push(createActivityLog(
                creator,
                'create',
                'customer',
                customer._id
            ));
        });

        // Devices - 5 records
        const devices = await Device.insertMany([
            {
                customer: customers[0]._id,
                device_type: "Laptop",
                manufacturer: "Lenovo",
                model_number: "ThinkPad X1 Carbon Gen 10",
                serial_number: "SN-X1C10-001",
                purchase_date: new Date('2022-06-15'),
                warranty_status: "In Warranty",
                is_ad_hoc: false,
                specifications: { cpu: "Intel Core i7", ram: "16GB", storage: "1TB SSD", os: "Windows 11 Pro" }
            },
            {
                customer: customers[1]._id,
                device_type: "Desktop",
                manufacturer: "Lenovo",
                model_number: "ThinkCentre M90a",
                serial_number: "SN-TCM90A-002",
                purchase_date: new Date('2021-11-20'),
                warranty_status: "Out of Warranty",
                is_ad_hoc: false,
                specifications: { cpu: "Intel Core i5", ram: "8GB", storage: "512GB SSD", os: "Windows 10 Pro" }
            },
            {
                customer: customers[2]._id,
                device_type: "Laptop",
                manufacturer: "Lenovo",
                model_number: "Yoga 9i",
                serial_number: "SN-Y9I-003",
                purchase_date: new Date('2022-09-05'),
                warranty_status: "In Warranty",
                is_ad_hoc: false,
                specifications: { cpu: "Intel Core i7", ram: "16GB", storage: "512GB SSD", os: "Windows 11 Home" }
            },
            {
                customer: customers[3]._id,
                device_type: "Server",
                manufacturer: "Lenovo",
                model_number: "ThinkSystem SR650",
                serial_number: "SN-TSSR650-004",
                purchase_date: new Date('2020-05-15'),
                warranty_status: "Out of Warranty",
                is_ad_hoc: false,
                specifications: { cpu: "Dual Xeon Silver", ram: "64GB", storage: "4TB HDD", os: "Windows Server 2019" }
            },
            {
                customer: customers[4]._id,
                device_type: "Laptop",
                manufacturer: "Lenovo",
                model_number: "IdeaPad 5",
                serial_number: "SN-IP5-ADHOC1",
                purchase_date: new Date('2023-04-05'),
                warranty_status: "In Warranty",
                is_ad_hoc: true,
                specifications: { cpu: "Intel Core i5", ram: "8GB", storage: "512GB SSD", os: "Windows 11 Home" }
            }
        ]);
        console.log(`✅ Inserted ${devices.length} devices`);

        // Log device creation
        devices.forEach(device => {
            const creator = getRandomItem(users.filter(u => ['administrator', 'manager', 'coordinator'].includes(u.role)));
            activityLogs.push(createActivityLog(
                creator,
                'create',
                'device',
                device._id
            ));
        });

        // Get technician users
        const technicians = users.filter(u => u.role === 'technician');
        const coordinators = users.filter(u => u.role === 'coordinator');
        const managers = users.filter(u => u.role === 'manager');

        // Jobs - 5 records
        const jobs = await Job.insertMany([
            {
                job_number: "JOB001",
                serial_number: devices[0].serial_number,
                customer: customers[0]._id,
                device: devices[0]._id,
                job_type: "workshop",
                warranty_status: "In Warranty",
                is_ad_hoc_customer: false,
                is_ad_hoc_device: false,
                description: "Laptop not powering on. Suspected motherboard issue.",
                attachments: [createAttachment('image', 'device1.jpg', users[0]._id)],
                priority: "High",
                status: "Assigned",
                created_by: coordinators[0]._id,
                assigned_to: technicians[0]._id,
                scheduled_date: new Date('2023-06-15')
            },
            {
                job_number: "JOB002",
                serial_number: devices[1].serial_number,
                customer: customers[1]._id,
                device: devices[1]._id,
                job_type: "onsite",
                warranty_status: "Out of Warranty",
                is_ad_hoc_customer: false,
                is_ad_hoc_device: false,
                description: "Desktop making loud noise. Likely fan replacement needed.",
                attachments: [createAttachment('image', 'device2.jpg', users[1]._id)],
                priority: "Medium",
                status: "In Progress",
                created_by: coordinators[1]._id,
                assigned_to: technicians[1]._id,
                scheduled_date: new Date('2023-06-16')
            },
            {
                job_number: "JOB003",
                serial_number: devices[2].serial_number,
                customer: customers[2]._id,
                device: devices[2]._id,
                job_type: "workshop",
                warranty_status: "In Warranty",
                is_ad_hoc_customer: false,
                is_ad_hoc_device: false,
                description: "Screen flickering issue. Possible display cable or panel problem.",
                attachments: [createAttachment('image', 'device3.jpg', coordinators[0]._id)],
                priority: "High",
                status: "Assigned",
                created_by: coordinators[0]._id,
                assigned_to: technicians[2]._id,
                scheduled_date: new Date('2023-06-17')
            },
            {
                job_number: "JOB004",
                serial_number: devices[3].serial_number,
                customer: customers[3]._id,
                device: devices[3]._id,
                job_type: "onsite",
                warranty_status: "Out of Warranty",
                is_ad_hoc_customer: false,
                is_ad_hoc_device: false,
                description: "Server experiencing random shutdowns. Diagnostics needed.",
                attachments: [createAttachment('image', 'device4.jpg', coordinators[1]._id)],
                priority: "Urgent",
                status: "Assigned",
                created_by: coordinators[1]._id,
                assigned_to: technicians[3]._id,
                scheduled_date: new Date('2023-06-18')
            },
            {
                job_number: "JOB005",
                serial_number: devices[4].serial_number,
                customer: customers[4]._id,
                device: devices[4]._id,
                job_type: "workshop",
                warranty_status: "In Warranty",
                is_ad_hoc_customer: true,
                is_ad_hoc_device: true,
                description: "Ad-hoc customer device - Keyboard keys not working properly",
                attachments: [createAttachment('image', 'adhoc_device1.jpg', coordinators[0]._id)],
                priority: "Urgent",
                status: "Assigned",
                created_by: coordinators[0]._id,
                assigned_to: technicians[4]._id,
                scheduled_date: new Date('2023-06-19')
            }
        ]);
        console.log(`✅ Inserted ${jobs.length} jobs`);

        // Log job creation
        jobs.forEach(job => {
            const creator = users.find(u => u._id.equals(job.created_by));
            activityLogs.push(createActivityLog(
                creator,
                'create',
                'job',
                job._id,
                {
                    status: job.status,
                    is_ad_hoc_customer: job.is_ad_hoc_customer,
                    is_ad_hoc_device: job.is_ad_hoc_device
                }
            ));
        });

        // Job Updates - 5 records
        const jobUpdates = await JobUpdate.insertMany([
            {
                job_id: jobs[0]._id,
                updated_by: jobs[0].assigned_to,
                update_text: "Initial diagnosis confirms motherboard failure. Need to order replacement part.",
                parts_used: "",
                update_timestamp: new Date('2023-06-15T10:30:00')
            },
            {
                job_id: jobs[1]._id,
                updated_by: jobs[1].assigned_to,
                update_text: "Fan replaced successfully. System running quietly now.",
                parts_used: "ThinkCentre Cooling Fan - P/N: 5C50W13835",
                update_timestamp: new Date('2023-06-16T14:15:00')
            },
            {
                job_id: jobs[2]._id,
                updated_by: jobs[2].assigned_to,
                update_text: "Confirmed display panel issue. Ordered replacement screen.",
                parts_used: "Yoga 9i Display Assembly - P/N: 5B30W12345",
                update_timestamp: new Date('2023-06-17T11:20:00')
            },
            {
                job_id: jobs[3]._id,
                updated_by: jobs[3].assigned_to,
                update_text: "Diagnostics complete. Found faulty power supply unit.",
                parts_used: "",
                update_timestamp: new Date('2023-06-18T15:45:00')
            },
            {
                job_id: jobs[4]._id,
                updated_by: jobs[4].assigned_to,
                update_text: "Keyboard replacement required. Ordered new keyboard assembly.",
                parts_used: "IdeaPad 5 Keyboard - P/N: 5B40W6789",
                update_timestamp: new Date('2023-06-19T11:45:00')
            }
        ]);
        console.log(`✅ Inserted ${jobUpdates.length} job updates`);

        // Log job updates
        jobUpdates.forEach(update => {
            const updater = users.find(u => u._id.equals(update.updated_by));
            activityLogs.push(createActivityLog(
                updater,
                'update',
                'job',
                update.job_id,
                { update_text: update.update_text }
            ));
        });

        // Parts Requests - 5 records
        const partsRequests = await PartsRequest.insertMany([
            {
                job_id: jobs[0]._id,
                requested_by: jobs[0].assigned_to,
                parts_description: "ThinkPad X1 Carbon Gen 10 Motherboard",
                attachments: [createAttachment('image', 'motherboard.jpg', jobs[0].assigned_to)],
                urgency: "High",
                status: "Pending",
                requested_at: new Date('2023-06-15T10:35:00')
            },
            {
                job_id: jobs[1]._id,
                requested_by: jobs[1].assigned_to,
                parts_description: "ThinkCentre Cooling Fan",
                attachments: [createAttachment('image', 'fan.jpg', jobs[1].assigned_to)],
                urgency: "Medium",
                status: "Approved",
                requested_at: new Date('2023-06-16T09:15:00'),
                approved_by: users.find(u => u.role === 'parts_team')._id,
                approved_at: new Date('2023-06-16T10:30:00')
            },
            {
                job_id: jobs[2]._id,
                requested_by: jobs[2].assigned_to,
                parts_description: "Yoga 9i Display Assembly",
                attachments: [createAttachment('image', 'display.jpg', jobs[2].assigned_to)],
                urgency: "High",
                status: "Approved",
                requested_at: new Date('2023-06-17T11:25:00'),
                approved_by: users.find(u => u.role === 'parts_team')._id,
                approved_at: new Date('2023-06-17T12:45:00')
            },
            {
                job_id: jobs[3]._id,
                requested_by: jobs[3].assigned_to,
                parts_description: "ThinkSystem Power Supply Unit",
                attachments: [createAttachment('image', 'psu.jpg', jobs[3].assigned_to)],
                urgency: "Low",
                status: "Pending",
                requested_at: new Date('2023-06-18T16:00:00')
            },
            {
                job_id: jobs[4]._id,
                requested_by: jobs[4].assigned_to,
                parts_description: "IdeaPad 5 Keyboard Assembly",
                attachments: [createAttachment('image', 'keyboard.jpg', jobs[4].assigned_to)],
                urgency: "High",
                status: "Approved",
                requested_at: new Date('2023-06-19T12:00:00'),
                approved_by: users.find(u => u.role === 'parts_team')._id,
                approved_at: new Date('2023-06-19T12:30:00')
            }
        ]);
        console.log(`✅ Inserted ${partsRequests.length} parts requests`);

        // Log parts requests
        partsRequests.forEach(request => {
            const requester = users.find(u => u._id.equals(request.requested_by));
            activityLogs.push(createActivityLog(
                requester,
                'create',
                'parts_request',
                request._id,
                { status: request.status }
            ));
        });

        // System Issues - 5 records
        const systemIssues = await SystemIssue.insertMany([
            {
                reported_by: technicians[0]._id,
                title: "Login page not loading",
                description: "Getting 500 error when trying to access login page",
                status: "Open",
                priority: "High",
                category: "Bug",
                screenshots: [createAttachment('image', 'login_error.jpg', technicians[0]._id)],
                created_at: new Date('2023-06-10T09:15:00'),
                updated_at: new Date('2023-06-10T09:15:00')
            },
            {
                reported_by: technicians[1]._id,
                title: "Job assignment notifications not working",
                description: "Technicians not receiving email notifications when assigned to jobs",
                status: "In Progress",
                priority: "High",
                category: "Bug",
                screenshots: [createAttachment('image', 'notifications.jpg', technicians[1]._id)],
                created_at: new Date('2023-06-11T10:30:00'),
                updated_at: new Date('2023-06-12T14:20:00')
            },
            {
                reported_by: coordinators[0]._id,
                title: "Add bulk customer import feature",
                description: "Need ability to import multiple customers from CSV file",
                status: "Open",
                priority: "Medium",
                category: "Feature Request",
                created_at: new Date('2023-06-12T11:45:00'),
                updated_at: new Date('2023-06-12T11:45:00')
            },
            {
                reported_by: managers[0]._id,
                title: "Dashboard performance slow",
                description: "Dashboard takes too long to load when there are many active jobs",
                status: "Open",
                priority: "Medium",
                category: "Performance",
                created_at: new Date('2023-06-13T14:00:00'),
                updated_at: new Date('2023-06-13T14:00:00')
            },
            {
                reported_by: technicians[2]._id,
                title: "Mobile view needs improvement",
                description: "Many form elements don't display properly on mobile devices",
                status: "Open",
                priority: "Low",
                category: "UI/UX",
                screenshots: [createAttachment('image', 'mobile_view.jpg', technicians[2]._id)],
                created_at: new Date('2023-06-14T08:30:00'),
                updated_at: new Date('2023-06-14T08:30:00')
            }
        ]);
        console.log(`✅ Inserted ${systemIssues.length} system issues`);

        // Log system issues creation
        systemIssues.forEach(issue => {
            const reporter = users.find(u => u._id.equals(issue.reported_by));
            activityLogs.push(createActivityLog(
                reporter,
                'create',
                'system_issue',
                issue._id,
                {
                    status: issue.status,
                    priority: issue.priority
                }
            ));
        });

        // Insert all activity logs
        await ActivityLog.insertMany(activityLogs);
        console.log(`✅ Inserted ${activityLogs.length} activity logs`);

        console.log(`
🎉 Seed complete!
   Users: ${users.length} (including ${technicians.length} technicians)
   Customers: ${customers.length}
   Devices: ${devices.length}
   Jobs: ${jobs.length}
   Job Updates: ${jobUpdates.length}
   Parts Requests: ${partsRequests.length}
   System Issues: ${systemIssues.length}
   Activity Logs: ${activityLogs.length}
        `);
    } catch (e) {
        console.error('❌ Seeding error:', e);
    } finally {
        mongoose.disconnect();
    }
};

seedDB();