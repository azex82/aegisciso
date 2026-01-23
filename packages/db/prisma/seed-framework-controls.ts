/**
 * Framework Controls Seed Data
 * Full control sets for ISO 27001:2022, NCA ECC, NIST CSF, and SOC 2
 * Based on ML Pipeline specification requirements
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// ISO 27001:2022 Controls (93 controls across 4 themes)
// ============================================================================
const iso27001Controls = [
  // Organizational Controls (37 controls: A.5.1 - A.5.37)
  { code: 'A.5.1', title: 'Policies for information security', category: 'Organizational', description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.' },
  { code: 'A.5.2', title: 'Information security roles and responsibilities', category: 'Organizational', description: 'Information security roles and responsibilities shall be defined and allocated according to the organization needs.' },
  { code: 'A.5.3', title: 'Segregation of duties', category: 'Organizational', description: 'Conflicting duties and conflicting areas of responsibility shall be segregated.' },
  { code: 'A.5.4', title: 'Management responsibilities', category: 'Organizational', description: 'Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization.' },
  { code: 'A.5.5', title: 'Contact with authorities', category: 'Organizational', description: 'The organization shall establish and maintain contact with relevant authorities.' },
  { code: 'A.5.6', title: 'Contact with special interest groups', category: 'Organizational', description: 'The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.' },
  { code: 'A.5.7', title: 'Threat intelligence', category: 'Organizational', description: 'Information relating to information security threats shall be collected and analysed to produce threat intelligence.' },
  { code: 'A.5.8', title: 'Information security in project management', category: 'Organizational', description: 'Information security shall be integrated into project management.' },
  { code: 'A.5.9', title: 'Inventory of information and other associated assets', category: 'Organizational', description: 'An inventory of information and other associated assets, including owners, shall be developed and maintained.' },
  { code: 'A.5.10', title: 'Acceptable use of information and other associated assets', category: 'Organizational', description: 'Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.' },
  { code: 'A.5.11', title: 'Return of assets', category: 'Organizational', description: 'Personnel and other interested parties as appropriate shall return all the organization\'s assets in their possession upon change or termination of their employment, contract or agreement.' },
  { code: 'A.5.12', title: 'Classification of information', category: 'Organizational', description: 'Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.' },
  { code: 'A.5.13', title: 'Labelling of information', category: 'Organizational', description: 'An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.' },
  { code: 'A.5.14', title: 'Information transfer', category: 'Organizational', description: 'Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.' },
  { code: 'A.5.15', title: 'Access control', category: 'Organizational', description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.' },
  { code: 'A.5.16', title: 'Identity management', category: 'Organizational', description: 'The full life cycle of identities shall be managed.' },
  { code: 'A.5.17', title: 'Authentication information', category: 'Organizational', description: 'Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.' },
  { code: 'A.5.18', title: 'Access rights', category: 'Organizational', description: 'Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization\'s topic-specific policy on and rules for access control.' },
  { code: 'A.5.19', title: 'Information security in supplier relationships', category: 'Organizational', description: 'Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier\'s products or services.' },
  { code: 'A.5.20', title: 'Addressing information security within supplier agreements', category: 'Organizational', description: 'Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.' },
  { code: 'A.5.21', title: 'Managing information security in the ICT supply chain', category: 'Organizational', description: 'Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.' },
  { code: 'A.5.22', title: 'Monitoring, review and change management of supplier services', category: 'Organizational', description: 'The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.' },
  { code: 'A.5.23', title: 'Information security for use of cloud services', category: 'Organizational', description: 'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization\'s information security requirements.' },
  { code: 'A.5.24', title: 'Information security incident management planning and preparation', category: 'Organizational', description: 'The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.' },
  { code: 'A.5.25', title: 'Assessment and decision on information security events', category: 'Organizational', description: 'The organization shall assess information security events and decide if they are to be categorized as information security incidents.' },
  { code: 'A.5.26', title: 'Response to information security incidents', category: 'Organizational', description: 'Information security incidents shall be responded to in accordance with the documented procedures.' },
  { code: 'A.5.27', title: 'Learning from information security incidents', category: 'Organizational', description: 'Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.' },
  { code: 'A.5.28', title: 'Collection of evidence', category: 'Organizational', description: 'The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.' },
  { code: 'A.5.29', title: 'Information security during disruption', category: 'Organizational', description: 'The organization shall plan how to maintain information security at an appropriate level during disruption.' },
  { code: 'A.5.30', title: 'ICT readiness for business continuity', category: 'Organizational', description: 'ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.' },
  { code: 'A.5.31', title: 'Legal, statutory, regulatory and contractual requirements', category: 'Organizational', description: 'Legal, statutory, regulatory and contractual requirements relevant to information security and the organization\'s approach to meet these requirements shall be identified, documented and kept up to date.' },
  { code: 'A.5.32', title: 'Intellectual property rights', category: 'Organizational', description: 'The organization shall implement appropriate procedures to protect intellectual property rights.' },
  { code: 'A.5.33', title: 'Protection of records', category: 'Organizational', description: 'Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.' },
  { code: 'A.5.34', title: 'Privacy and protection of PII', category: 'Organizational', description: 'The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.' },
  { code: 'A.5.35', title: 'Independent review of information security', category: 'Organizational', description: 'The organization\'s approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.' },
  { code: 'A.5.36', title: 'Compliance with policies, rules and standards for information security', category: 'Organizational', description: 'Compliance with the organization\'s information security policy, topic-specific policies, rules and standards shall be regularly reviewed.' },
  { code: 'A.5.37', title: 'Documented operating procedures', category: 'Organizational', description: 'Operating procedures for information processing facilities shall be documented and made available to personnel who need them.' },

  // People Controls (8 controls: A.6.1 - A.6.8)
  { code: 'A.6.1', title: 'Screening', category: 'People', description: 'Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.' },
  { code: 'A.6.2', title: 'Terms and conditions of employment', category: 'People', description: 'The employment contractual agreements shall state the personnel\'s and the organization\'s responsibilities for information security.' },
  { code: 'A.6.3', title: 'Information security awareness, education and training', category: 'People', description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization\'s information security policy, topic-specific policies and procedures, as relevant for their job function.' },
  { code: 'A.6.4', title: 'Disciplinary process', category: 'People', description: 'A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.' },
  { code: 'A.6.5', title: 'Responsibilities after termination or change of employment', category: 'People', description: 'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.' },
  { code: 'A.6.6', title: 'Confidentiality or non-disclosure agreements', category: 'People', description: 'Confidentiality or non-disclosure agreements reflecting the organization\'s needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.' },
  { code: 'A.6.7', title: 'Remote working', category: 'People', description: 'Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization\'s premises.' },
  { code: 'A.6.8', title: 'Information security event reporting', category: 'People', description: 'The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.' },

  // Physical Controls (14 controls: A.7.1 - A.7.14)
  { code: 'A.7.1', title: 'Physical security perimeters', category: 'Physical', description: 'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.' },
  { code: 'A.7.2', title: 'Physical entry', category: 'Physical', description: 'Secure areas shall be protected by appropriate entry controls and access points.' },
  { code: 'A.7.3', title: 'Securing offices, rooms and facilities', category: 'Physical', description: 'Physical security for offices, rooms and facilities shall be designed and implemented.' },
  { code: 'A.7.4', title: 'Physical security monitoring', category: 'Physical', description: 'Premises shall be continuously monitored for unauthorized physical access.' },
  { code: 'A.7.5', title: 'Protecting against physical and environmental threats', category: 'Physical', description: 'Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.' },
  { code: 'A.7.6', title: 'Working in secure areas', category: 'Physical', description: 'Security measures for working in secure areas shall be designed and implemented.' },
  { code: 'A.7.7', title: 'Clear desk and clear screen', category: 'Physical', description: 'Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.' },
  { code: 'A.7.8', title: 'Equipment siting and protection', category: 'Physical', description: 'Equipment shall be sited securely and protected.' },
  { code: 'A.7.9', title: 'Security of assets off-premises', category: 'Physical', description: 'Off-site assets shall be protected.' },
  { code: 'A.7.10', title: 'Storage media', category: 'Physical', description: 'Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization\'s classification scheme and handling requirements.' },
  { code: 'A.7.11', title: 'Supporting utilities', category: 'Physical', description: 'Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.' },
  { code: 'A.7.12', title: 'Cabling security', category: 'Physical', description: 'Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.' },
  { code: 'A.7.13', title: 'Equipment maintenance', category: 'Physical', description: 'Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.' },
  { code: 'A.7.14', title: 'Secure disposal or re-use of equipment', category: 'Physical', description: 'Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.' },

  // Technological Controls (34 controls: A.8.1 - A.8.34)
  { code: 'A.8.1', title: 'User endpoint devices', category: 'Technological', description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.' },
  { code: 'A.8.2', title: 'Privileged access rights', category: 'Technological', description: 'The allocation and use of privileged access rights shall be restricted and managed.' },
  { code: 'A.8.3', title: 'Information access restriction', category: 'Technological', description: 'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.' },
  { code: 'A.8.4', title: 'Access to source code', category: 'Technological', description: 'Read and write access to source code, development tools and software libraries shall be appropriately managed.' },
  { code: 'A.8.5', title: 'Secure authentication', category: 'Technological', description: 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.' },
  { code: 'A.8.6', title: 'Capacity management', category: 'Technological', description: 'The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.' },
  { code: 'A.8.7', title: 'Protection against malware', category: 'Technological', description: 'Protection against malware shall be implemented and supported by appropriate user awareness.' },
  { code: 'A.8.8', title: 'Management of technical vulnerabilities', category: 'Technological', description: 'Information about technical vulnerabilities of information systems in use shall be obtained, the organization\'s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.' },
  { code: 'A.8.9', title: 'Configuration management', category: 'Technological', description: 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.' },
  { code: 'A.8.10', title: 'Information deletion', category: 'Technological', description: 'Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.' },
  { code: 'A.8.11', title: 'Data masking', category: 'Technological', description: 'Data masking shall be used in accordance with the organization\'s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.' },
  { code: 'A.8.12', title: 'Data leakage prevention', category: 'Technological', description: 'Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.' },
  { code: 'A.8.13', title: 'Information backup', category: 'Technological', description: 'Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.' },
  { code: 'A.8.14', title: 'Redundancy of information processing facilities', category: 'Technological', description: 'Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.' },
  { code: 'A.8.15', title: 'Logging', category: 'Technological', description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.' },
  { code: 'A.8.16', title: 'Monitoring activities', category: 'Technological', description: 'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.' },
  { code: 'A.8.17', title: 'Clock synchronization', category: 'Technological', description: 'The clocks of information processing systems used by the organization shall be synchronized to approved time sources.' },
  { code: 'A.8.18', title: 'Use of privileged utility programs', category: 'Technological', description: 'The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.' },
  { code: 'A.8.19', title: 'Installation of software on operational systems', category: 'Technological', description: 'Procedures and measures shall be implemented to securely manage software installation on operational systems.' },
  { code: 'A.8.20', title: 'Networks security', category: 'Technological', description: 'Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.' },
  { code: 'A.8.21', title: 'Security of network services', category: 'Technological', description: 'Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.' },
  { code: 'A.8.22', title: 'Segregation of networks', category: 'Technological', description: 'Groups of information services, users and information systems shall be segregated in the organization\'s networks.' },
  { code: 'A.8.23', title: 'Web filtering', category: 'Technological', description: 'Access to external websites shall be managed to reduce exposure to malicious content.' },
  { code: 'A.8.24', title: 'Use of cryptography', category: 'Technological', description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.' },
  { code: 'A.8.25', title: 'Secure development life cycle', category: 'Technological', description: 'Rules for the secure development of software and systems shall be established and applied.' },
  { code: 'A.8.26', title: 'Application security requirements', category: 'Technological', description: 'Information security requirements shall be identified, specified and approved when developing or acquiring applications.' },
  { code: 'A.8.27', title: 'Secure system architecture and engineering principles', category: 'Technological', description: 'Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.' },
  { code: 'A.8.28', title: 'Secure coding', category: 'Technological', description: 'Secure coding principles shall be applied to software development.' },
  { code: 'A.8.29', title: 'Security testing in development and acceptance', category: 'Technological', description: 'Security testing processes shall be defined and implemented in the development life cycle.' },
  { code: 'A.8.30', title: 'Outsourced development', category: 'Technological', description: 'The organization shall direct, monitor and review the activities related to outsourced system development.' },
  { code: 'A.8.31', title: 'Separation of development, test and production environments', category: 'Technological', description: 'Development, testing and production environments shall be separated and secured.' },
  { code: 'A.8.32', title: 'Change management', category: 'Technological', description: 'Changes to information processing facilities and information systems shall be subject to change management procedures.' },
  { code: 'A.8.33', title: 'Test information', category: 'Technological', description: 'Test information shall be appropriately selected, protected and managed.' },
  { code: 'A.8.34', title: 'Protection of information systems during audit testing', category: 'Technological', description: 'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.' },
];

// ============================================================================
// NCA ECC Controls (114 controls across 5 domains)
// ============================================================================
const ncaEccControls = [
  // 1. Cybersecurity Governance (29 controls)
  { code: '1-1-1', title: 'Cybersecurity Strategy', category: 'Governance', subCategory: 'Strategy', description: 'Develop and document cybersecurity strategy aligned with business objectives' },
  { code: '1-1-2', title: 'Strategy Review', category: 'Governance', subCategory: 'Strategy', description: 'Review and update cybersecurity strategy periodically' },
  { code: '1-1-3', title: 'Strategy Communication', category: 'Governance', subCategory: 'Strategy', description: 'Communicate cybersecurity strategy to stakeholders' },
  { code: '1-2-1', title: 'Cybersecurity Governance Framework', category: 'Governance', subCategory: 'Framework', description: 'Establish cybersecurity governance framework' },
  { code: '1-2-2', title: 'Roles and Responsibilities', category: 'Governance', subCategory: 'Framework', description: 'Define cybersecurity roles and responsibilities' },
  { code: '1-2-3', title: 'CISO Appointment', category: 'Governance', subCategory: 'Framework', description: 'Appoint a Chief Information Security Officer' },
  { code: '1-2-4', title: 'Governance Committee', category: 'Governance', subCategory: 'Framework', description: 'Establish cybersecurity governance committee' },
  { code: '1-3-1', title: 'Cybersecurity Policies', category: 'Governance', subCategory: 'Policies', description: 'Develop comprehensive cybersecurity policies' },
  { code: '1-3-2', title: 'Policy Review', category: 'Governance', subCategory: 'Policies', description: 'Review and update policies regularly' },
  { code: '1-3-3', title: 'Policy Communication', category: 'Governance', subCategory: 'Policies', description: 'Communicate policies to all personnel' },
  { code: '1-3-4', title: 'Policy Compliance', category: 'Governance', subCategory: 'Policies', description: 'Monitor and enforce policy compliance' },
  { code: '1-4-1', title: 'Risk Management Framework', category: 'Governance', subCategory: 'Risk', description: 'Establish cybersecurity risk management framework' },
  { code: '1-4-2', title: 'Risk Assessment', category: 'Governance', subCategory: 'Risk', description: 'Conduct regular risk assessments' },
  { code: '1-4-3', title: 'Risk Treatment', category: 'Governance', subCategory: 'Risk', description: 'Implement risk treatment plans' },
  { code: '1-4-4', title: 'Risk Monitoring', category: 'Governance', subCategory: 'Risk', description: 'Monitor and review risks continuously' },
  { code: '1-5-1', title: 'Compliance Requirements', category: 'Governance', subCategory: 'Compliance', description: 'Identify regulatory and compliance requirements' },
  { code: '1-5-2', title: 'Compliance Monitoring', category: 'Governance', subCategory: 'Compliance', description: 'Monitor compliance status' },
  { code: '1-5-3', title: 'Audit Management', category: 'Governance', subCategory: 'Compliance', description: 'Manage internal and external audits' },
  { code: '1-6-1', title: 'Security Awareness Program', category: 'Governance', subCategory: 'Awareness', description: 'Establish security awareness program' },
  { code: '1-6-2', title: 'Training Requirements', category: 'Governance', subCategory: 'Awareness', description: 'Define role-based training requirements' },
  { code: '1-6-3', title: 'Awareness Metrics', category: 'Governance', subCategory: 'Awareness', description: 'Measure awareness program effectiveness' },
  { code: '1-7-1', title: 'HR Security Screening', category: 'Governance', subCategory: 'HR Security', description: 'Conduct background checks for personnel' },
  { code: '1-7-2', title: 'Employment Terms', category: 'Governance', subCategory: 'HR Security', description: 'Include security in employment terms' },
  { code: '1-7-3', title: 'Termination Procedures', category: 'Governance', subCategory: 'HR Security', description: 'Implement secure termination procedures' },
  { code: '1-8-1', title: 'Project Security', category: 'Governance', subCategory: 'Projects', description: 'Integrate security in project management' },
  { code: '1-8-2', title: 'Security Requirements', category: 'Governance', subCategory: 'Projects', description: 'Define security requirements for projects' },
  { code: '1-9-1', title: 'Performance Metrics', category: 'Governance', subCategory: 'Performance', description: 'Define cybersecurity performance metrics' },
  { code: '1-9-2', title: 'Reporting', category: 'Governance', subCategory: 'Performance', description: 'Report cybersecurity status to management' },
  { code: '1-9-3', title: 'Continuous Improvement', category: 'Governance', subCategory: 'Performance', description: 'Implement continuous improvement processes' },

  // 2. Cybersecurity Defense (42 controls)
  { code: '2-1-1', title: 'Asset Inventory', category: 'Defense', subCategory: 'Asset Management', description: 'Maintain inventory of information assets' },
  { code: '2-1-2', title: 'Asset Classification', category: 'Defense', subCategory: 'Asset Management', description: 'Classify assets based on criticality' },
  { code: '2-1-3', title: 'Asset Ownership', category: 'Defense', subCategory: 'Asset Management', description: 'Assign asset ownership' },
  { code: '2-1-4', title: 'Asset Lifecycle', category: 'Defense', subCategory: 'Asset Management', description: 'Manage asset lifecycle' },
  { code: '2-2-1', title: 'Identity Management', category: 'Defense', subCategory: 'IAM', description: 'Implement identity management processes' },
  { code: '2-2-2', title: 'Authentication', category: 'Defense', subCategory: 'IAM', description: 'Implement strong authentication mechanisms' },
  { code: '2-2-3', title: 'Multi-Factor Authentication', category: 'Defense', subCategory: 'IAM', description: 'Require MFA for critical systems' },
  { code: '2-2-4', title: 'Access Control', category: 'Defense', subCategory: 'IAM', description: 'Implement role-based access control' },
  { code: '2-2-5', title: 'Privileged Access', category: 'Defense', subCategory: 'IAM', description: 'Manage privileged access accounts' },
  { code: '2-2-6', title: 'Access Review', category: 'Defense', subCategory: 'IAM', description: 'Review access rights periodically' },
  { code: '2-3-1', title: 'Network Architecture', category: 'Defense', subCategory: 'Network', description: 'Design secure network architecture' },
  { code: '2-3-2', title: 'Network Segmentation', category: 'Defense', subCategory: 'Network', description: 'Implement network segmentation' },
  { code: '2-3-3', title: 'Firewall Management', category: 'Defense', subCategory: 'Network', description: 'Deploy and manage firewalls' },
  { code: '2-3-4', title: 'Intrusion Detection', category: 'Defense', subCategory: 'Network', description: 'Implement intrusion detection systems' },
  { code: '2-3-5', title: 'Wireless Security', category: 'Defense', subCategory: 'Network', description: 'Secure wireless networks' },
  { code: '2-3-6', title: 'Remote Access', category: 'Defense', subCategory: 'Network', description: 'Secure remote access' },
  { code: '2-4-1', title: 'Data Classification', category: 'Defense', subCategory: 'Data Protection', description: 'Classify data based on sensitivity' },
  { code: '2-4-2', title: 'Data Encryption', category: 'Defense', subCategory: 'Data Protection', description: 'Encrypt sensitive data' },
  { code: '2-4-3', title: 'Data Loss Prevention', category: 'Defense', subCategory: 'Data Protection', description: 'Implement DLP controls' },
  { code: '2-4-4', title: 'Data Backup', category: 'Defense', subCategory: 'Data Protection', description: 'Implement data backup procedures' },
  { code: '2-4-5', title: 'Data Retention', category: 'Defense', subCategory: 'Data Protection', description: 'Define data retention policies' },
  { code: '2-4-6', title: 'Data Disposal', category: 'Defense', subCategory: 'Data Protection', description: 'Secure data disposal procedures' },
  { code: '2-5-1', title: 'Cryptographic Policy', category: 'Defense', subCategory: 'Cryptography', description: 'Establish cryptographic policy' },
  { code: '2-5-2', title: 'Key Management', category: 'Defense', subCategory: 'Cryptography', description: 'Implement key management processes' },
  { code: '2-5-3', title: 'PKI Management', category: 'Defense', subCategory: 'Cryptography', description: 'Manage public key infrastructure' },
  { code: '2-6-1', title: 'Endpoint Protection', category: 'Defense', subCategory: 'Endpoint', description: 'Deploy endpoint protection solutions' },
  { code: '2-6-2', title: 'Malware Protection', category: 'Defense', subCategory: 'Endpoint', description: 'Implement anti-malware controls' },
  { code: '2-6-3', title: 'Patch Management', category: 'Defense', subCategory: 'Endpoint', description: 'Manage patches and updates' },
  { code: '2-6-4', title: 'Mobile Device Security', category: 'Defense', subCategory: 'Endpoint', description: 'Secure mobile devices' },
  { code: '2-6-5', title: 'Removable Media', category: 'Defense', subCategory: 'Endpoint', description: 'Control removable media usage' },
  { code: '2-7-1', title: 'Secure Development', category: 'Defense', subCategory: 'Application', description: 'Implement secure development lifecycle' },
  { code: '2-7-2', title: 'Code Review', category: 'Defense', subCategory: 'Application', description: 'Conduct security code reviews' },
  { code: '2-7-3', title: 'Application Testing', category: 'Defense', subCategory: 'Application', description: 'Perform application security testing' },
  { code: '2-7-4', title: 'Web Application Security', category: 'Defense', subCategory: 'Application', description: 'Secure web applications' },
  { code: '2-7-5', title: 'API Security', category: 'Defense', subCategory: 'Application', description: 'Secure APIs' },
  { code: '2-8-1', title: 'Physical Access Control', category: 'Defense', subCategory: 'Physical', description: 'Control physical access to facilities' },
  { code: '2-8-2', title: 'Environmental Controls', category: 'Defense', subCategory: 'Physical', description: 'Implement environmental controls' },
  { code: '2-8-3', title: 'Equipment Security', category: 'Defense', subCategory: 'Physical', description: 'Secure equipment and devices' },
  { code: '2-8-4', title: 'Visitor Management', category: 'Defense', subCategory: 'Physical', description: 'Manage visitor access' },
  { code: '2-9-1', title: 'Email Security', category: 'Defense', subCategory: 'Email', description: 'Implement email security controls' },
  { code: '2-9-2', title: 'Anti-Phishing', category: 'Defense', subCategory: 'Email', description: 'Deploy anti-phishing measures' },
  { code: '2-9-3', title: 'Email Filtering', category: 'Defense', subCategory: 'Email', description: 'Filter malicious emails' },

  // 3. Cybersecurity Resilience (23 controls)
  { code: '3-1-1', title: 'Security Monitoring', category: 'Resilience', subCategory: 'Monitoring', description: 'Implement security monitoring' },
  { code: '3-1-2', title: 'SIEM Implementation', category: 'Resilience', subCategory: 'Monitoring', description: 'Deploy SIEM solution' },
  { code: '3-1-3', title: 'Log Management', category: 'Resilience', subCategory: 'Monitoring', description: 'Centralize and manage logs' },
  { code: '3-1-4', title: 'Alert Management', category: 'Resilience', subCategory: 'Monitoring', description: 'Manage security alerts' },
  { code: '3-1-5', title: 'Threat Detection', category: 'Resilience', subCategory: 'Monitoring', description: 'Detect threats and anomalies' },
  { code: '3-2-1', title: 'Vulnerability Scanning', category: 'Resilience', subCategory: 'Vulnerability', description: 'Conduct regular vulnerability scans' },
  { code: '3-2-2', title: 'Penetration Testing', category: 'Resilience', subCategory: 'Vulnerability', description: 'Perform penetration testing' },
  { code: '3-2-3', title: 'Vulnerability Remediation', category: 'Resilience', subCategory: 'Vulnerability', description: 'Remediate identified vulnerabilities' },
  { code: '3-2-4', title: 'Threat Intelligence', category: 'Resilience', subCategory: 'Vulnerability', description: 'Leverage threat intelligence' },
  { code: '3-3-1', title: 'Incident Response Plan', category: 'Resilience', subCategory: 'Incident', description: 'Develop incident response plan' },
  { code: '3-3-2', title: 'Incident Response Team', category: 'Resilience', subCategory: 'Incident', description: 'Establish incident response team' },
  { code: '3-3-3', title: 'Incident Detection', category: 'Resilience', subCategory: 'Incident', description: 'Detect security incidents' },
  { code: '3-3-4', title: 'Incident Containment', category: 'Resilience', subCategory: 'Incident', description: 'Contain security incidents' },
  { code: '3-3-5', title: 'Incident Recovery', category: 'Resilience', subCategory: 'Incident', description: 'Recover from security incidents' },
  { code: '3-3-6', title: 'Incident Reporting', category: 'Resilience', subCategory: 'Incident', description: 'Report incidents to authorities' },
  { code: '3-3-7', title: 'Lessons Learned', category: 'Resilience', subCategory: 'Incident', description: 'Conduct post-incident reviews' },
  { code: '3-4-1', title: 'BCP Development', category: 'Resilience', subCategory: 'Continuity', description: 'Develop business continuity plans' },
  { code: '3-4-2', title: 'DRP Development', category: 'Resilience', subCategory: 'Continuity', description: 'Develop disaster recovery plans' },
  { code: '3-4-3', title: 'Recovery Objectives', category: 'Resilience', subCategory: 'Continuity', description: 'Define RTO and RPO' },
  { code: '3-4-4', title: 'BCP Testing', category: 'Resilience', subCategory: 'Continuity', description: 'Test business continuity plans' },
  { code: '3-4-5', title: 'Crisis Management', category: 'Resilience', subCategory: 'Continuity', description: 'Establish crisis management procedures' },
  { code: '3-5-1', title: 'Digital Forensics', category: 'Resilience', subCategory: 'Forensics', description: 'Establish digital forensics capability' },
  { code: '3-5-2', title: 'Evidence Collection', category: 'Resilience', subCategory: 'Forensics', description: 'Collect and preserve evidence' },

  // 4. Third-Party Cybersecurity (10 controls)
  { code: '4-1-1', title: 'Vendor Assessment', category: 'Third Party', subCategory: 'Assessment', description: 'Assess vendor security posture' },
  { code: '4-1-2', title: 'Vendor Risk Management', category: 'Third Party', subCategory: 'Assessment', description: 'Manage vendor risks' },
  { code: '4-1-3', title: 'Contract Requirements', category: 'Third Party', subCategory: 'Contracts', description: 'Include security in contracts' },
  { code: '4-1-4', title: 'SLA Management', category: 'Third Party', subCategory: 'Contracts', description: 'Define security SLAs' },
  { code: '4-1-5', title: 'Vendor Monitoring', category: 'Third Party', subCategory: 'Monitoring', description: 'Monitor vendor performance' },
  { code: '4-2-1', title: 'Cloud Security Assessment', category: 'Third Party', subCategory: 'Cloud', description: 'Assess cloud provider security' },
  { code: '4-2-2', title: 'Cloud Security Controls', category: 'Third Party', subCategory: 'Cloud', description: 'Implement cloud security controls' },
  { code: '4-2-3', title: 'Cloud Data Protection', category: 'Third Party', subCategory: 'Cloud', description: 'Protect data in cloud' },
  { code: '4-2-4', title: 'Cloud Access Management', category: 'Third Party', subCategory: 'Cloud', description: 'Manage cloud access' },
  { code: '4-2-5', title: 'Cloud Monitoring', category: 'Third Party', subCategory: 'Cloud', description: 'Monitor cloud environments' },

  // 5. Industrial Control Systems (10 controls)
  { code: '5-1-1', title: 'ICS Security Governance', category: 'ICS', subCategory: 'Governance', description: 'Establish ICS security governance' },
  { code: '5-1-2', title: 'ICS Risk Assessment', category: 'ICS', subCategory: 'Governance', description: 'Assess ICS security risks' },
  { code: '5-2-1', title: 'ICS Network Segmentation', category: 'ICS', subCategory: 'Network', description: 'Segment ICS networks' },
  { code: '5-2-2', title: 'ICS Access Control', category: 'ICS', subCategory: 'Access', description: 'Control ICS access' },
  { code: '5-2-3', title: 'ICS Remote Access', category: 'ICS', subCategory: 'Access', description: 'Secure ICS remote access' },
  { code: '5-3-1', title: 'ICS Monitoring', category: 'ICS', subCategory: 'Monitoring', description: 'Monitor ICS environments' },
  { code: '5-3-2', title: 'ICS Incident Response', category: 'ICS', subCategory: 'Incident', description: 'Respond to ICS incidents' },
  { code: '5-4-1', title: 'ICS Patch Management', category: 'ICS', subCategory: 'Maintenance', description: 'Manage ICS patches' },
  { code: '5-4-2', title: 'ICS Configuration Management', category: 'ICS', subCategory: 'Maintenance', description: 'Manage ICS configurations' },
  { code: '5-4-3', title: 'ICS Recovery', category: 'ICS', subCategory: 'Recovery', description: 'Plan for ICS recovery' },
];

// ============================================================================
// NIST CSF Controls (108 controls across 6 functions)
// ============================================================================
const nistCsfControls = [
  // GOVERN Function (18 controls)
  { code: 'GV.OC-01', title: 'Organizational Context', category: 'Govern', subCategory: 'Organizational Context', description: 'The organizational mission is understood and informs cybersecurity risk management' },
  { code: 'GV.OC-02', title: 'Internal Stakeholders', category: 'Govern', subCategory: 'Organizational Context', description: 'Internal stakeholders understand their roles and responsibilities' },
  { code: 'GV.OC-03', title: 'Legal Requirements', category: 'Govern', subCategory: 'Organizational Context', description: 'Legal, regulatory, and contractual requirements are understood and managed' },
  { code: 'GV.OC-04', title: 'Critical Objectives', category: 'Govern', subCategory: 'Organizational Context', description: 'Critical objectives, capabilities, and services are understood and communicated' },
  { code: 'GV.OC-05', title: 'Dependencies', category: 'Govern', subCategory: 'Organizational Context', description: 'Outcomes, capabilities, and services dependencies are understood' },
  { code: 'GV.RM-01', title: 'Risk Management Strategy', category: 'Govern', subCategory: 'Risk Management Strategy', description: 'Risk management objectives are established and agreed to' },
  { code: 'GV.RM-02', title: 'Risk Appetite', category: 'Govern', subCategory: 'Risk Management Strategy', description: 'Risk appetite and risk tolerance statements are established' },
  { code: 'GV.RM-03', title: 'Risk Management Activities', category: 'Govern', subCategory: 'Risk Management Strategy', description: 'Cybersecurity risk management activities are integrated into enterprise risk management' },
  { code: 'GV.RM-04', title: 'Risk Priorities', category: 'Govern', subCategory: 'Risk Management Strategy', description: 'Strategic direction that describes appropriate risk response options is established' },
  { code: 'GV.RR-01', title: 'Organizational Roles', category: 'Govern', subCategory: 'Roles and Responsibilities', description: 'Organizational leadership establishes and maintains an organizational structure' },
  { code: 'GV.RR-02', title: 'Authorities', category: 'Govern', subCategory: 'Roles and Responsibilities', description: 'Roles, responsibilities, and authorities related to cybersecurity are established' },
  { code: 'GV.RR-03', title: 'Adequate Resources', category: 'Govern', subCategory: 'Roles and Responsibilities', description: 'Adequate resources are allocated commensurate with cybersecurity risk strategy' },
  { code: 'GV.RR-04', title: 'Cybersecurity in HR', category: 'Govern', subCategory: 'Roles and Responsibilities', description: 'Cybersecurity is included in human resources practices' },
  { code: 'GV.PO-01', title: 'Policy Establishment', category: 'Govern', subCategory: 'Policy', description: 'Policy for managing cybersecurity risks is established based on context, scope, and priorities' },
  { code: 'GV.PO-02', title: 'Policy Review', category: 'Govern', subCategory: 'Policy', description: 'Policy is reviewed, updated, communicated, and enforced to reflect changes' },
  { code: 'GV.SC-01', title: 'Supply Chain Program', category: 'Govern', subCategory: 'Supply Chain', description: 'A cybersecurity supply chain risk management program is established' },
  { code: 'GV.SC-02', title: 'Supplier Requirements', category: 'Govern', subCategory: 'Supply Chain', description: 'Cybersecurity roles and responsibilities for suppliers are established' },
  { code: 'GV.SC-03', title: 'Supply Chain Monitoring', category: 'Govern', subCategory: 'Supply Chain', description: 'Supply chain security is integrated into cybersecurity practices' },

  // IDENTIFY Function (21 controls)
  { code: 'ID.AM-01', title: 'Hardware Inventory', category: 'Identify', subCategory: 'Asset Management', description: 'Inventories of hardware managed by the organization are maintained' },
  { code: 'ID.AM-02', title: 'Software Inventory', category: 'Identify', subCategory: 'Asset Management', description: 'Inventories of software and services managed by the organization are maintained' },
  { code: 'ID.AM-03', title: 'Data Flow Mapping', category: 'Identify', subCategory: 'Asset Management', description: 'Representations of authorized network communication and data flows are maintained' },
  { code: 'ID.AM-04', title: 'External Systems', category: 'Identify', subCategory: 'Asset Management', description: 'Inventories of services provided by suppliers are maintained' },
  { code: 'ID.AM-05', title: 'Asset Prioritization', category: 'Identify', subCategory: 'Asset Management', description: 'Assets are prioritized based on classification, criticality, and value' },
  { code: 'ID.AM-06', title: 'Workforce Roles', category: 'Identify', subCategory: 'Asset Management', description: 'Cybersecurity roles and responsibilities for the entire workforce are established' },
  { code: 'ID.AM-07', title: 'Asset Documentation', category: 'Identify', subCategory: 'Asset Management', description: 'Information system and component information are documented' },
  { code: 'ID.RA-01', title: 'Vulnerability Identification', category: 'Identify', subCategory: 'Risk Assessment', description: 'Vulnerabilities in assets are identified, validated, and recorded' },
  { code: 'ID.RA-02', title: 'Threat Intelligence', category: 'Identify', subCategory: 'Risk Assessment', description: 'Cyber threat intelligence is received from information sharing forums' },
  { code: 'ID.RA-03', title: 'Threat Identification', category: 'Identify', subCategory: 'Risk Assessment', description: 'Internal and external threats are identified and recorded' },
  { code: 'ID.RA-04', title: 'Impact Analysis', category: 'Identify', subCategory: 'Risk Assessment', description: 'Potential impacts and likelihoods of threats exploiting vulnerabilities are identified' },
  { code: 'ID.RA-05', title: 'Risk Determination', category: 'Identify', subCategory: 'Risk Assessment', description: 'Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk' },
  { code: 'ID.RA-06', title: 'Risk Response', category: 'Identify', subCategory: 'Risk Assessment', description: 'Risk responses are chosen, prioritized, planned, tracked, and communicated' },
  { code: 'ID.RA-07', title: 'Risk Changes', category: 'Identify', subCategory: 'Risk Assessment', description: 'Changes and exceptions are managed, assessed, and tracked' },
  { code: 'ID.RA-08', title: 'Risk Acceptance', category: 'Identify', subCategory: 'Risk Assessment', description: 'Risk acceptance decisions are made for residual risks' },
  { code: 'ID.RA-09', title: 'Risk Assessment Frequency', category: 'Identify', subCategory: 'Risk Assessment', description: 'Frequency of risk assessments is determined based on factors' },
  { code: 'ID.RA-10', title: 'Critical Suppliers', category: 'Identify', subCategory: 'Risk Assessment', description: 'Critical suppliers are assessed on a recurring basis' },
  { code: 'ID.IM-01', title: 'Improvement Planning', category: 'Identify', subCategory: 'Improvement', description: 'Improvements are identified from evaluations' },
  { code: 'ID.IM-02', title: 'Improvement Tracking', category: 'Identify', subCategory: 'Improvement', description: 'Improvements are prioritized, documented, and tracked to completion' },
  { code: 'ID.IM-03', title: 'Improvement Verification', category: 'Identify', subCategory: 'Improvement', description: 'Results from improvements are evaluated against agreed expectations' },
  { code: 'ID.IM-04', title: 'Response Exercises', category: 'Identify', subCategory: 'Improvement', description: 'Incident response plans and other cybersecurity plans are tested and updated' },

  // PROTECT Function (27 controls)
  { code: 'PR.AA-01', title: 'Identity Management', category: 'Protect', subCategory: 'Identity Management', description: 'Identities and credentials for authorized users, services, and hardware are managed' },
  { code: 'PR.AA-02', title: 'Identity Proofing', category: 'Protect', subCategory: 'Identity Management', description: 'Identities are proofed and bound to credentials' },
  { code: 'PR.AA-03', title: 'Credential Lifecycle', category: 'Protect', subCategory: 'Identity Management', description: 'Users, services, and hardware are authenticated' },
  { code: 'PR.AA-04', title: 'Access Assertions', category: 'Protect', subCategory: 'Identity Management', description: 'Identity assertions are protected, conveyed, and verified' },
  { code: 'PR.AA-05', title: 'Access Permissions', category: 'Protect', subCategory: 'Identity Management', description: 'Access permissions, entitlements, and authorizations are defined' },
  { code: 'PR.AA-06', title: 'Physical Access', category: 'Protect', subCategory: 'Identity Management', description: 'Physical access to assets is managed, monitored, and enforced' },
  { code: 'PR.AT-01', title: 'Awareness Training', category: 'Protect', subCategory: 'Awareness Training', description: 'Personnel are provided awareness and training' },
  { code: 'PR.AT-02', title: 'Role-Based Training', category: 'Protect', subCategory: 'Awareness Training', description: 'Individuals in specialized roles are provided awareness and training' },
  { code: 'PR.DS-01', title: 'Data-at-Rest Protection', category: 'Protect', subCategory: 'Data Security', description: 'The confidentiality, integrity, and availability of data-at-rest are protected' },
  { code: 'PR.DS-02', title: 'Data-in-Transit Protection', category: 'Protect', subCategory: 'Data Security', description: 'The confidentiality, integrity, and availability of data-in-transit are protected' },
  { code: 'PR.DS-03', title: 'Data-in-Use Protection', category: 'Protect', subCategory: 'Data Security', description: 'Data-in-use is protected against unauthorized access and modification' },
  { code: 'PR.DS-04', title: 'Data Backup', category: 'Protect', subCategory: 'Data Security', description: 'Backups of data are created, protected, maintained, and tested' },
  { code: 'PR.DS-05', title: 'Data Integrity', category: 'Protect', subCategory: 'Data Security', description: 'The integrity of hardware and software are verified' },
  { code: 'PR.DS-06', title: 'Data Retention', category: 'Protect', subCategory: 'Data Security', description: 'Data are retained in accordance with compliance requirements' },
  { code: 'PR.PS-01', title: 'Configuration Management', category: 'Protect', subCategory: 'Platform Security', description: 'Configuration management practices are established and applied' },
  { code: 'PR.PS-02', title: 'Software Maintenance', category: 'Protect', subCategory: 'Platform Security', description: 'Software is maintained, replaced, and removed' },
  { code: 'PR.PS-03', title: 'Hardware Maintenance', category: 'Protect', subCategory: 'Platform Security', description: 'Hardware is maintained, replaced, and removed' },
  { code: 'PR.PS-04', title: 'Log Records', category: 'Protect', subCategory: 'Platform Security', description: 'Log records are created and retained' },
  { code: 'PR.PS-05', title: 'Installation Restrictions', category: 'Protect', subCategory: 'Platform Security', description: 'Installation and execution of unauthorized software are prevented' },
  { code: 'PR.PS-06', title: 'Secure Development', category: 'Protect', subCategory: 'Platform Security', description: 'Secure software development practices are integrated' },
  { code: 'PR.IR-01', title: 'Network Protection', category: 'Protect', subCategory: 'Infrastructure Resilience', description: 'Networks and environments are protected from unauthorized access' },
  { code: 'PR.IR-02', title: 'Architecture Protection', category: 'Protect', subCategory: 'Infrastructure Resilience', description: 'The organization\'s technology infrastructure is protected' },
  { code: 'PR.IR-03', title: 'Segregation', category: 'Protect', subCategory: 'Infrastructure Resilience', description: 'Mechanisms are implemented for achieving resilience requirements' },
  { code: 'PR.IR-04', title: 'Availability', category: 'Protect', subCategory: 'Infrastructure Resilience', description: 'Adequate resource capacity is available to ensure availability' },
  { code: 'PR.IP-01', title: 'Baseline Configuration', category: 'Protect', subCategory: 'Information Protection', description: 'Baseline configurations are created, documented, and maintained' },
  { code: 'PR.IP-02', title: 'Change Control', category: 'Protect', subCategory: 'Information Protection', description: 'Changes to configurations are reviewed and approved' },
  { code: 'PR.IP-03', title: 'Baseline Compliance', category: 'Protect', subCategory: 'Information Protection', description: 'Compliance with baseline configurations is monitored' },

  // DETECT Function (14 controls)
  { code: 'DE.CM-01', title: 'Network Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Networks and network services are monitored for adverse events' },
  { code: 'DE.CM-02', title: 'Physical Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'The physical environment is monitored for adverse events' },
  { code: 'DE.CM-03', title: 'Personnel Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Personnel activity and technology usage are monitored' },
  { code: 'DE.CM-04', title: 'Malicious Code Detection', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Malicious code is detected' },
  { code: 'DE.CM-05', title: 'Unauthorized Mobile Code', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Unauthorized mobile code is detected' },
  { code: 'DE.CM-06', title: 'External Provider Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'External service provider activity is monitored' },
  { code: 'DE.CM-07', title: 'Unauthorized Access Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Monitoring for unauthorized personnel, connections, devices, and software' },
  { code: 'DE.CM-08', title: 'Vulnerability Scanning', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Vulnerability scans are performed' },
  { code: 'DE.CM-09', title: 'Computing Resources Monitoring', category: 'Detect', subCategory: 'Continuous Monitoring', description: 'Computing hardware and software are monitored' },
  { code: 'DE.AE-01', title: 'Baseline Operations', category: 'Detect', subCategory: 'Adverse Event Analysis', description: 'A baseline of network operations and expected data flows is established' },
  { code: 'DE.AE-02', title: 'Event Analysis', category: 'Detect', subCategory: 'Adverse Event Analysis', description: 'Detected adverse events are analyzed' },
  { code: 'DE.AE-03', title: 'Event Correlation', category: 'Detect', subCategory: 'Adverse Event Analysis', description: 'Event data are collected and correlated from multiple sources' },
  { code: 'DE.AE-04', title: 'Impact Estimation', category: 'Detect', subCategory: 'Adverse Event Analysis', description: 'Impact of events is estimated' },
  { code: 'DE.AE-05', title: 'Alert Thresholds', category: 'Detect', subCategory: 'Adverse Event Analysis', description: 'Incident alert thresholds are established' },

  // RESPOND Function (14 controls)
  { code: 'RS.MA-01', title: 'Incident Management', category: 'Respond', subCategory: 'Incident Management', description: 'The incident response plan is executed in coordination with relevant third parties' },
  { code: 'RS.MA-02', title: 'Incident Reporting', category: 'Respond', subCategory: 'Incident Management', description: 'Incidents are reported consistent with established criteria' },
  { code: 'RS.MA-03', title: 'Incident Categorization', category: 'Respond', subCategory: 'Incident Management', description: 'Incidents are categorized and prioritized' },
  { code: 'RS.MA-04', title: 'Incident Escalation', category: 'Respond', subCategory: 'Incident Management', description: 'Incidents are escalated as necessary' },
  { code: 'RS.MA-05', title: 'Incident Criteria', category: 'Respond', subCategory: 'Incident Management', description: 'The criteria for initiating incident response are applied' },
  { code: 'RS.AN-01', title: 'Incident Investigation', category: 'Respond', subCategory: 'Incident Analysis', description: 'Investigation is conducted' },
  { code: 'RS.AN-02', title: 'Forensic Investigation', category: 'Respond', subCategory: 'Incident Analysis', description: 'Forensic investigation and analysis are conducted' },
  { code: 'RS.AN-03', title: 'Root Cause', category: 'Respond', subCategory: 'Incident Analysis', description: 'Root cause of an incident is identified and documented' },
  { code: 'RS.CO-01', title: 'Internal Coordination', category: 'Respond', subCategory: 'Incident Response Coordination', description: 'Personnel know their roles and coordinate during incidents' },
  { code: 'RS.CO-02', title: 'External Coordination', category: 'Respond', subCategory: 'Incident Response Coordination', description: 'External stakeholders are coordinated with during incidents' },
  { code: 'RS.CO-03', title: 'Information Sharing', category: 'Respond', subCategory: 'Incident Response Coordination', description: 'Information is shared consistent with response plans' },
  { code: 'RS.MI-01', title: 'Incident Containment', category: 'Respond', subCategory: 'Incident Mitigation', description: 'Incidents are contained' },
  { code: 'RS.MI-02', title: 'Incident Mitigation', category: 'Respond', subCategory: 'Incident Mitigation', description: 'Incidents are mitigated' },
  { code: 'RS.MI-03', title: 'Vulnerability Mitigation', category: 'Respond', subCategory: 'Incident Mitigation', description: 'Newly identified vulnerabilities are mitigated or documented' },

  // RECOVER Function (14 controls)
  { code: 'RC.RP-01', title: 'Recovery Plan Execution', category: 'Recover', subCategory: 'Recovery Planning', description: 'The recovery portion of the incident response plan is executed' },
  { code: 'RC.RP-02', title: 'Recovery Selection', category: 'Recover', subCategory: 'Recovery Planning', description: 'Recovery actions are selected, scoped, prioritized, and performed' },
  { code: 'RC.RP-03', title: 'Backup Verification', category: 'Recover', subCategory: 'Recovery Planning', description: 'Backups are verified before use to recover' },
  { code: 'RC.RP-04', title: 'Mission Functions', category: 'Recover', subCategory: 'Recovery Planning', description: 'Critical mission functions and associated cybersecurity risk management are considered' },
  { code: 'RC.RP-05', title: 'Data Integrity Check', category: 'Recover', subCategory: 'Recovery Planning', description: 'The integrity of backups and restored assets is verified' },
  { code: 'RC.RP-06', title: 'Recovery Completion', category: 'Recover', subCategory: 'Recovery Planning', description: 'The end of incident recovery is declared' },
  { code: 'RC.CO-01', title: 'Public Relations', category: 'Recover', subCategory: 'Recovery Communication', description: 'Public relations are managed' },
  { code: 'RC.CO-02', title: 'Reputation Repair', category: 'Recover', subCategory: 'Recovery Communication', description: 'Reputation is repaired after an incident' },
  { code: 'RC.CO-03', title: 'Recovery Activities', category: 'Recover', subCategory: 'Recovery Communication', description: 'Recovery activities and progress in restoring capabilities are communicated' },
  { code: 'RC.CO-04', title: 'Stakeholder Updates', category: 'Recover', subCategory: 'Recovery Communication', description: 'Internal and external stakeholders are updated' },
  { code: 'RC.IM-01', title: 'Recovery Lessons', category: 'Recover', subCategory: 'Recovery Improvements', description: 'Recovery plans incorporate lessons learned' },
  { code: 'RC.IM-02', title: 'Recovery Strategy Update', category: 'Recover', subCategory: 'Recovery Improvements', description: 'Recovery strategies are updated' },
  { code: 'RC.IM-03', title: 'Recovery Plan Update', category: 'Recover', subCategory: 'Recovery Improvements', description: 'Recovery plans are tested and updated' },
  { code: 'RC.IM-04', title: 'Recovery Metrics', category: 'Recover', subCategory: 'Recovery Improvements', description: 'Recovery metrics are collected and analyzed' },
];

// ============================================================================
// SOC 2 Controls (89 controls across 5 Trust Service Criteria)
// ============================================================================
const soc2Controls = [
  // Security (Common Criteria - 33 controls)
  { code: 'CC1.1', title: 'COSO Principle 1', category: 'Security', subCategory: 'Control Environment', description: 'The entity demonstrates a commitment to integrity and ethical values' },
  { code: 'CC1.2', title: 'COSO Principle 2', category: 'Security', subCategory: 'Control Environment', description: 'The board of directors demonstrates independence and exercises oversight' },
  { code: 'CC1.3', title: 'COSO Principle 3', category: 'Security', subCategory: 'Control Environment', description: 'Management establishes structures, reporting lines, authorities, and responsibilities' },
  { code: 'CC1.4', title: 'COSO Principle 4', category: 'Security', subCategory: 'Control Environment', description: 'The entity demonstrates commitment to competence' },
  { code: 'CC1.5', title: 'COSO Principle 5', category: 'Security', subCategory: 'Control Environment', description: 'The entity holds individuals accountable for internal control responsibilities' },
  { code: 'CC2.1', title: 'COSO Principle 13', category: 'Security', subCategory: 'Communication', description: 'The entity obtains and generates relevant quality information' },
  { code: 'CC2.2', title: 'COSO Principle 14', category: 'Security', subCategory: 'Communication', description: 'The entity internally communicates information' },
  { code: 'CC2.3', title: 'COSO Principle 15', category: 'Security', subCategory: 'Communication', description: 'The entity communicates with external parties' },
  { code: 'CC3.1', title: 'COSO Principle 6', category: 'Security', subCategory: 'Risk Assessment', description: 'The entity specifies objectives with sufficient clarity' },
  { code: 'CC3.2', title: 'COSO Principle 7', category: 'Security', subCategory: 'Risk Assessment', description: 'The entity identifies risks to achievement of objectives' },
  { code: 'CC3.3', title: 'COSO Principle 8', category: 'Security', subCategory: 'Risk Assessment', description: 'The entity considers potential for fraud in assessing risks' },
  { code: 'CC3.4', title: 'COSO Principle 9', category: 'Security', subCategory: 'Risk Assessment', description: 'The entity identifies and assesses changes impacting internal control' },
  { code: 'CC4.1', title: 'COSO Principle 16', category: 'Security', subCategory: 'Monitoring Activities', description: 'The entity selects and develops ongoing and separate evaluations' },
  { code: 'CC4.2', title: 'COSO Principle 17', category: 'Security', subCategory: 'Monitoring Activities', description: 'The entity evaluates and communicates internal control deficiencies' },
  { code: 'CC5.1', title: 'COSO Principle 10', category: 'Security', subCategory: 'Control Activities', description: 'The entity selects and develops control activities' },
  { code: 'CC5.2', title: 'COSO Principle 11', category: 'Security', subCategory: 'Control Activities', description: 'The entity selects and develops general controls over technology' },
  { code: 'CC5.3', title: 'COSO Principle 12', category: 'Security', subCategory: 'Control Activities', description: 'The entity deploys control activities through policies and procedures' },
  { code: 'CC6.1', title: 'Logical Access Security', category: 'Security', subCategory: 'Logical Access', description: 'Logical access security software, infrastructure, and architectures' },
  { code: 'CC6.2', title: 'User Registration', category: 'Security', subCategory: 'Logical Access', description: 'New users are registered and authorized' },
  { code: 'CC6.3', title: 'Access Removal', category: 'Security', subCategory: 'Logical Access', description: 'Access to protected information assets is removed when appropriate' },
  { code: 'CC6.4', title: 'Access Restriction', category: 'Security', subCategory: 'Logical Access', description: 'Access to data, software, and protected information is restricted' },
  { code: 'CC6.5', title: 'Access Review', category: 'Security', subCategory: 'Logical Access', description: 'Appropriate controls are in place to review and approve access' },
  { code: 'CC6.6', title: 'Protection from Threats', category: 'Security', subCategory: 'Logical Access', description: 'Procedures protect against unauthorized access' },
  { code: 'CC6.7', title: 'Data Transmission', category: 'Security', subCategory: 'Logical Access', description: 'Data transmitted is protected' },
  { code: 'CC6.8', title: 'Threat Identification', category: 'Security', subCategory: 'Logical Access', description: 'Methods exist to identify and address threats' },
  { code: 'CC7.1', title: 'Configuration Standards', category: 'Security', subCategory: 'System Operations', description: 'Configuration standards for infrastructure and software' },
  { code: 'CC7.2', title: 'Security Events', category: 'Security', subCategory: 'System Operations', description: 'Infrastructure and software are monitored for security events' },
  { code: 'CC7.3', title: 'Security Event Evaluation', category: 'Security', subCategory: 'System Operations', description: 'Security events are evaluated' },
  { code: 'CC7.4', title: 'Incident Response', category: 'Security', subCategory: 'System Operations', description: 'Security incidents are identified and responded to' },
  { code: 'CC7.5', title: 'Incident Recovery', category: 'Security', subCategory: 'System Operations', description: 'Identified security incidents are evaluated and remediated' },
  { code: 'CC8.1', title: 'Change Management', category: 'Security', subCategory: 'Change Management', description: 'Changes to infrastructure, data, software, and procedures are authorized' },
  { code: 'CC9.1', title: 'Risk Mitigation', category: 'Security', subCategory: 'Risk Mitigation', description: 'Entity identifies, selects, and develops risk mitigation activities' },
  { code: 'CC9.2', title: 'Vendor Management', category: 'Security', subCategory: 'Risk Mitigation', description: 'Entity assesses and manages vendor and business partner risks' },

  // Availability (14 controls)
  { code: 'A1.1', title: 'Capacity Planning', category: 'Availability', subCategory: 'Capacity', description: 'Entity maintains, monitors, and evaluates capacity requirements' },
  { code: 'A1.2', title: 'Environmental Protections', category: 'Availability', subCategory: 'Environmental', description: 'Environmental protections, software, and data backup infrastructure' },
  { code: 'A1.3', title: 'Recovery Testing', category: 'Availability', subCategory: 'Recovery', description: 'Recovery procedures are tested periodically' },
  { code: 'A1.4', title: 'Business Continuity', category: 'Availability', subCategory: 'Continuity', description: 'Business continuity and disaster recovery processes are established' },
  { code: 'A1.5', title: 'Recovery Plan Testing', category: 'Availability', subCategory: 'Recovery', description: 'Recovery procedures are tested periodically' },
  { code: 'A1.6', title: 'Backup Storage', category: 'Availability', subCategory: 'Backup', description: 'System backups are stored at separate locations' },
  { code: 'A1.7', title: 'Backup Restoration', category: 'Availability', subCategory: 'Backup', description: 'Procedures exist to restore system from backups' },
  { code: 'A1.8', title: 'Backup Monitoring', category: 'Availability', subCategory: 'Backup', description: 'Backup jobs are monitored' },
  { code: 'A1.9', title: 'Redundancy', category: 'Availability', subCategory: 'Redundancy', description: 'Redundancy is established for critical systems' },
  { code: 'A1.10', title: 'Incident Communication', category: 'Availability', subCategory: 'Communication', description: 'Communication regarding availability incidents' },
  { code: 'A1.11', title: 'Alternative Processing', category: 'Availability', subCategory: 'Recovery', description: 'Alternative processing facilities are established' },
  { code: 'A1.12', title: 'Power Systems', category: 'Availability', subCategory: 'Environmental', description: 'Power and environmental systems are maintained' },
  { code: 'A1.13', title: 'Network Redundancy', category: 'Availability', subCategory: 'Redundancy', description: 'Network redundancy is established' },
  { code: 'A1.14', title: 'Incident Prevention', category: 'Availability', subCategory: 'Prevention', description: 'Controls prevent and detect availability incidents' },

  // Processing Integrity (14 controls)
  { code: 'PI1.1', title: 'Processing Accuracy', category: 'Processing Integrity', subCategory: 'Processing', description: 'Procedures exist to ensure processing accuracy' },
  { code: 'PI1.2', title: 'Input Validation', category: 'Processing Integrity', subCategory: 'Input', description: 'Input validation controls are implemented' },
  { code: 'PI1.3', title: 'Processing Validation', category: 'Processing Integrity', subCategory: 'Processing', description: 'Processing validation controls verify accuracy' },
  { code: 'PI1.4', title: 'Output Validation', category: 'Processing Integrity', subCategory: 'Output', description: 'Output validation controls verify accuracy' },
  { code: 'PI1.5', title: 'Error Handling', category: 'Processing Integrity', subCategory: 'Errors', description: 'Error handling procedures are established' },
  { code: 'PI1.6', title: 'Error Correction', category: 'Processing Integrity', subCategory: 'Errors', description: 'Error correction procedures are implemented' },
  { code: 'PI1.7', title: 'Data Integrity', category: 'Processing Integrity', subCategory: 'Data', description: 'Data integrity controls are implemented' },
  { code: 'PI1.8', title: 'Transaction Tracing', category: 'Processing Integrity', subCategory: 'Transactions', description: 'Transaction tracing is implemented' },
  { code: 'PI1.9', title: 'Processing Monitoring', category: 'Processing Integrity', subCategory: 'Monitoring', description: 'Processing is monitored for completeness and accuracy' },
  { code: 'PI1.10', title: 'Exception Handling', category: 'Processing Integrity', subCategory: 'Exceptions', description: 'Exception handling procedures are established' },
  { code: 'PI1.11', title: 'Reconciliation', category: 'Processing Integrity', subCategory: 'Reconciliation', description: 'Reconciliation procedures are performed' },
  { code: 'PI1.12', title: 'Data Correction', category: 'Processing Integrity', subCategory: 'Data', description: 'Data correction procedures are implemented' },
  { code: 'PI1.13', title: 'Processing Documentation', category: 'Processing Integrity', subCategory: 'Documentation', description: 'Processing documentation is maintained' },
  { code: 'PI1.14', title: 'Quality Assurance', category: 'Processing Integrity', subCategory: 'Quality', description: 'Quality assurance procedures are implemented' },

  // Confidentiality (14 controls)
  { code: 'C1.1', title: 'Data Classification', category: 'Confidentiality', subCategory: 'Classification', description: 'Procedures identify and classify confidential information' },
  { code: 'C1.2', title: 'Data Protection', category: 'Confidentiality', subCategory: 'Protection', description: 'Controls protect confidential information' },
  { code: 'C1.3', title: 'Access to Confidential Data', category: 'Confidentiality', subCategory: 'Access', description: 'Access to confidential information is restricted' },
  { code: 'C1.4', title: 'Confidentiality Agreements', category: 'Confidentiality', subCategory: 'Agreements', description: 'Confidentiality agreements are in place' },
  { code: 'C1.5', title: 'Data Encryption', category: 'Confidentiality', subCategory: 'Encryption', description: 'Confidential data is encrypted' },
  { code: 'C1.6', title: 'Data Retention', category: 'Confidentiality', subCategory: 'Retention', description: 'Retention and disposal policies are in place' },
  { code: 'C1.7', title: 'Data Disposal', category: 'Confidentiality', subCategory: 'Disposal', description: 'Secure disposal of confidential information' },
  { code: 'C1.8', title: 'Data Masking', category: 'Confidentiality', subCategory: 'Masking', description: 'Data masking procedures are implemented' },
  { code: 'C1.9', title: 'Key Management', category: 'Confidentiality', subCategory: 'Encryption', description: 'Encryption key management procedures' },
  { code: 'C1.10', title: 'Transmission Security', category: 'Confidentiality', subCategory: 'Transmission', description: 'Confidential data transmission is secured' },
  { code: 'C1.11', title: 'Third Party Sharing', category: 'Confidentiality', subCategory: 'Third Party', description: 'Third-party sharing of confidential data is controlled' },
  { code: 'C1.12', title: 'Data Loss Prevention', category: 'Confidentiality', subCategory: 'DLP', description: 'Data loss prevention controls are implemented' },
  { code: 'C1.13', title: 'Confidentiality Training', category: 'Confidentiality', subCategory: 'Training', description: 'Personnel receive confidentiality training' },
  { code: 'C1.14', title: 'Confidentiality Monitoring', category: 'Confidentiality', subCategory: 'Monitoring', description: 'Confidentiality controls are monitored' },

  // Privacy (14 controls)
  { code: 'P1.1', title: 'Privacy Notice', category: 'Privacy', subCategory: 'Notice', description: 'Privacy notice is provided to data subjects' },
  { code: 'P2.1', title: 'Consent', category: 'Privacy', subCategory: 'Choice', description: 'Consent is obtained for data collection' },
  { code: 'P3.1', title: 'Collection Limitation', category: 'Privacy', subCategory: 'Collection', description: 'Data collection is limited to stated purposes' },
  { code: 'P3.2', title: 'Data Sources', category: 'Privacy', subCategory: 'Collection', description: 'Data sources are documented' },
  { code: 'P4.1', title: 'Use Limitation', category: 'Privacy', subCategory: 'Use', description: 'Personal information use is limited' },
  { code: 'P4.2', title: 'Data Retention', category: 'Privacy', subCategory: 'Retention', description: 'Personal information is retained only as needed' },
  { code: 'P4.3', title: 'Disposal', category: 'Privacy', subCategory: 'Disposal', description: 'Personal information is disposed of securely' },
  { code: 'P5.1', title: 'Data Subject Access', category: 'Privacy', subCategory: 'Access', description: 'Data subjects can access their information' },
  { code: 'P5.2', title: 'Data Correction', category: 'Privacy', subCategory: 'Correction', description: 'Data subjects can correct their information' },
  { code: 'P6.1', title: 'Disclosure Limitation', category: 'Privacy', subCategory: 'Disclosure', description: 'Disclosure to third parties is limited' },
  { code: 'P6.2', title: 'Third Party Agreements', category: 'Privacy', subCategory: 'Third Party', description: 'Third-party privacy agreements are in place' },
  { code: 'P7.1', title: 'Data Quality', category: 'Privacy', subCategory: 'Quality', description: 'Personal information quality is maintained' },
  { code: 'P8.1', title: 'Privacy Complaints', category: 'Privacy', subCategory: 'Complaints', description: 'Privacy complaint process is established' },
  { code: 'P8.2', title: 'Breach Notification', category: 'Privacy', subCategory: 'Breach', description: 'Breach notification procedures are established' },
];

async function main() {
  console.log('Starting framework controls seed...\n');

  // Get existing frameworks
  const isoFramework = await prisma.framework.findUnique({ where: { code: 'ISO_27001' } });
  const ncaFramework = await prisma.framework.findUnique({ where: { code: 'NCA_ECC' } });
  const nistFramework = await prisma.framework.findUnique({ where: { code: 'NIST_CSF' } });
  const soc2Framework = await prisma.framework.findUnique({ where: { code: 'SOC2' } });

  if (!isoFramework || !ncaFramework || !nistFramework || !soc2Framework) {
    console.error('Error: Frameworks not found. Please run the main seed first.');
    console.log('Missing frameworks:', {
      ISO_27001: !isoFramework,
      NCA_ECC: !ncaFramework,
      NIST_CSF: !nistFramework,
      SOC2: !soc2Framework,
    });
    return;
  }

  // Seed ISO 27001 Controls
  console.log('Seeding ISO 27001:2022 controls...');
  let isoCount = 0;
  for (const control of iso27001Controls) {
    await prisma.frameworkControl.upsert({
      where: {
        frameworkId_code: {
          frameworkId: isoFramework.id,
          code: control.code,
        },
      },
      update: {
        title: control.title,
        category: control.category,
        description: control.description,
      },
      create: {
        frameworkId: isoFramework.id,
        code: control.code,
        title: control.title,
        category: control.category,
        description: control.description,
      },
    });
    isoCount++;
  }
  console.log(`  ✓ Created ${isoCount} ISO 27001 controls`);

  // Seed NCA ECC Controls (update existing and add new)
  console.log('Seeding NCA ECC controls...');
  // First, delete existing controls to replace with comprehensive set
  await prisma.frameworkControl.deleteMany({
    where: { frameworkId: ncaFramework.id },
  });

  let ncaCount = 0;
  for (const control of ncaEccControls) {
    await prisma.frameworkControl.create({
      data: {
        frameworkId: ncaFramework.id,
        code: control.code,
        title: control.title,
        category: control.category,
        subCategory: control.subCategory,
        description: control.description,
      },
    });
    ncaCount++;
  }
  console.log(`  ✓ Created ${ncaCount} NCA ECC controls`);

  // Seed NIST CSF Controls
  console.log('Seeding NIST CSF 2.0 controls...');
  let nistCount = 0;
  for (const control of nistCsfControls) {
    await prisma.frameworkControl.upsert({
      where: {
        frameworkId_code: {
          frameworkId: nistFramework.id,
          code: control.code,
        },
      },
      update: {
        title: control.title,
        category: control.category,
        subCategory: control.subCategory,
        description: control.description,
      },
      create: {
        frameworkId: nistFramework.id,
        code: control.code,
        title: control.title,
        category: control.category,
        subCategory: control.subCategory,
        description: control.description,
      },
    });
    nistCount++;
  }
  console.log(`  ✓ Created ${nistCount} NIST CSF controls`);

  // Seed SOC 2 Controls
  console.log('Seeding SOC 2 Type II controls...');
  let soc2Count = 0;
  for (const control of soc2Controls) {
    await prisma.frameworkControl.upsert({
      where: {
        frameworkId_code: {
          frameworkId: soc2Framework.id,
          code: control.code,
        },
      },
      update: {
        title: control.title,
        category: control.category,
        subCategory: control.subCategory,
        description: control.description,
      },
      create: {
        frameworkId: soc2Framework.id,
        code: control.code,
        title: control.title,
        category: control.category,
        subCategory: control.subCategory,
        description: control.description,
      },
    });
    soc2Count++;
  }
  console.log(`  ✓ Created ${soc2Count} SOC 2 controls`);

  console.log('\n========================================');
  console.log('Framework Controls Seed Summary:');
  console.log('========================================');
  console.log(`ISO 27001:2022    : ${isoCount} controls`);
  console.log(`NCA ECC           : ${ncaCount} controls`);
  console.log(`NIST CSF 2.0      : ${nistCount} controls`);
  console.log(`SOC 2 Type II     : ${soc2Count} controls`);
  console.log(`----------------------------------------`);
  console.log(`TOTAL             : ${isoCount + ncaCount + nistCount + soc2Count} controls`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
