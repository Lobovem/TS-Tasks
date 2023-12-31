const BUDGET_ZERO_VALUE = 0;

enum AreaEnum {
  FRONT = 'Front',
  BACK = 'Back',
  HR = 'HR',
}

enum StatusEnum {
  ACTIVE = 'Active',
  INACTIVE = 'InActive',
  PENDING = 'Pending',
}

type Budget = {
  debit: number;
  credit: number;
};

type PaymentInfo = {
  iban: string;
  swift: number;
};

// У вас є сутність - Компанія, яка має назву, список департаментів, список попередньо найнятого персоналу,
// а також список усього персоналу компанії - співробітники всіх департаментів і попередньо найняті.
class Company {
  name: string = 'HomeCompany';
  department: Department[] = [];
  preHireEmployees: PreHideEmployees[] = [];
  _staff: (PreHideEmployees | Employee)[] = [];

  get staff(): (PreHideEmployees | Employee)[] {
    // const employee = this.department.flatMap(x => x.employees) //why used spred?
    // const preHireEmployees = this.preHireEmployees;
    // const res = [...employee, ...preHireEmployees]
    // return res
    //flatMap - delete matrix on one level to up
    return [...this.department.flatMap((x) => x.employees), ...this.preHireEmployees]; //why used spred?
  }

  addDepartment(depart: Department) {
    this.department.push(depart);
  }

  addPreHideEmployees(preHireEmployees: PreHideEmployees) {
    this.preHireEmployees.push(preHireEmployees);
  }
}

// Сутність Департамент - має назву, доменну область, список своїх співробітників і бюджет, що складається з дебіту і кредиту.
// Так само у неї існують методи для обчислення балансу виходячи з поточного бюджету, додавання нових співробітників,
// який враховує зміни балансу і перетворення з Попередньо найнятого на Співробітника або видалення Співробітника з
// минулого відділу.

class Department {
  name: string;
  area: AreaEnum;
  employees: Employee[] = [];
  budget: Budget = {
    debit: BUDGET_ZERO_VALUE,
    credit: BUDGET_ZERO_VALUE,
  };

  get balance(): number {
    return this.budget.debit - this.budget.credit;
  }

  constructor(name: string, area: AreaEnum) {
    this.name = name;
    this.area = area;
  }

  //где поиск работника в другом департаменте?
  // addEmployee(newcomer: Employee | PreHideEmployees, paymentInfo: PaymentInfo): void {
  addEmployee(newcomer: Employee | PreHideEmployees): void {
    if (newcomer instanceof Employee) {
      newcomer.department = this;
      this.employees.push(newcomer);
    } else {
      const employee = new Employee(newcomer.firstName, newcomer.lastName, newcomer.salary, newcomer.paymentInfo);
      employee.department = this;
      this.employees.push(employee);
    }

    this.budget.credit -= newcomer.salary;
  }

  removeEmployee(employee: Employee): void {
    // if (employee) {
    //   const index = this.employees.indexOf(employee)
    //   this.employees.splice(index, 1)
    // }
    // debugger
    this.employees = this.employees.filter((elem) => elem !== employee);
    this.budget.credit += employee.salary;
  }
}
// Сутність Попередньо найнятого співробітника має ім'я, прізвище та номер банківського рахунку.

class PreHideEmployees {
  firstName: string;
  lastName: string;
  paymentInfo: PaymentInfo;
  salary: number;

  constructor(firstName: string, lastName: string, salary: number, paymentInfo: PaymentInfo) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.paymentInfo = paymentInfo;
    this.salary = salary;
  }
}

// Сутність Співробітника - ім'я, прізвище, платіжну інформацію, зарплату, статус (активний, неактивний, у неоплачуваній відпустці)
// і знання про департамент,
// до якого він прикріплений.

class Employee {
  // Not necessary (не обязательно) set type to status, when it assigned (присваивается) value from enum
  status = StatusEnum.PENDING;
  department: Department | null = null;
  firstName: string;
  lastName: string;
  salary: number;
  paymentInfo: PaymentInfo;

  setStatus(status: StatusEnum): void {
    this.status = status;
  }

  constructor(firstName: string, lastName: string, salary: number, paymentInfo: PaymentInfo) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.salary = salary;
    this.paymentInfo = paymentInfo;
  }
}

// Так само у нас є сутність Бухгалтерія, яка є департаментом і має властивість баланс, а також методи
// для взяття на баланс співробітника або департаменту, зняття з балансу і виплати зарплати для всього персоналу.
// Попередньо найняті співробітники отримують зарплату за допомогою зовнішніх оплат, Співробітники (тільки активні) - за допомогою внутрішніх.

class Accounting extends Department {
  constructor(name: string, area: AreaEnum) {
    super(name, area);
  }

  salaryBalance: (PreHideEmployees | Employee)[] = [];

  addPersonalToBalance(entity: Department | Employee | PreHideEmployees): void {
    DopFunc.isDepartment(entity) ? this.salaryBalance.push(...entity.employees) : this.salaryBalance.push(entity);
  }

  removePersonalFromBalance(entity: Employee | PreHideEmployees): void {
    if (DopFunc.isEmployee(entity)) {
      this.salaryBalance = this.salaryBalance.filter((elem) => elem !== entity);
    } else {
      this.salaryBalance = this.salaryBalance.filter((elem) => elem.firstName !== entity.firstName);
    }
  }

  salaryPayment(): void {
    for (const entity of this.salaryBalance) {
      if (DopFunc.isPreHireEmployees(entity))
        this.externalPayment(entity);

      else {
        //Here we use (entity as Employee) for set type TypeScript, that entity is copy of Employee class. 
        if ((entity as Employee).status !== StatusEnum.ACTIVE)
          continue
        this.internalPayment(entity);
      }
    }
  }


  //inside
  internalPayment(employee: Employee): void { }
  //outside
  externalPayment(preHireEmployees: PreHideEmployees): void { }
}

class DopFunc {
  //check out is entity of Employee?
  static isEmployee(entity: unknown): entity is Employee {
    //сужение типов
    return entity instanceof Employee;
  }

  //check out is entity of PreHideEmployees?
  static isPreHireEmployees(entity: unknown): entity is PreHideEmployees {
    //сужение типов
    return entity instanceof PreHideEmployees;
  }

  static isDepartment(entity: unknown): entity is Department {
    //сужение типов
    return entity instanceof Department;
  }
}

const HomeCompany = new Company();

const LobovEmlpoyee = new Employee('Лобов', 'Евгений', 1000, { iban: 'IbanNumber', swift: 12345 });
const ValyaPreHireEmployee = new PreHideEmployees('Lena', 'Lobova', 500, { iban: 'IbanNumber', swift: 9876 });
const LenaPreHireEmployee = new PreHideEmployees('Lenok', 'Tishenko', 800, { iban: 'IbanNumber', swift: 7676 });
const OlegPreHireEmployee = new PreHideEmployees('Oleg', 'Tishenko', 900, { iban: 'IbanNumber', swift: 2333 });

const DepartmentFront = new Department('Front', AreaEnum.FRONT);
const DepartmentBack = new Department('Back', AreaEnum.BACK);

DepartmentFront.addEmployee(LobovEmlpoyee);
DepartmentFront.addEmployee(ValyaPreHireEmployee);
DepartmentFront.addEmployee(LenaPreHireEmployee);

DepartmentBack.addEmployee(LobovEmlpoyee);
DepartmentBack.addEmployee(OlegPreHireEmployee);

console.log('DepartmentFront ====>', DepartmentFront);
console.log('LobovEmlpoyee ====>', LobovEmlpoyee);
console.log('ValyaPreHireEmployee ====>', ValyaPreHireEmployee);

HomeCompany.addDepartment(DepartmentFront);
HomeCompany.addPreHideEmployees(ValyaPreHireEmployee);

console.log('HomeCompany ====>', HomeCompany);
console.log(DepartmentBack);
console.log('DepartmentFront before delete', DepartmentFront.employees);

DepartmentFront.removeEmployee(LobovEmlpoyee);
console.log('DepartmentFront after delete', DepartmentFront.employees);

const AccountingGeneral = new Accounting('General', AreaEnum.FRONT);
AccountingGeneral.addPersonalToBalance(LobovEmlpoyee);
AccountingGeneral.addPersonalToBalance(DepartmentFront);

AccountingGeneral.removePersonalFromBalance(LobovEmlpoyee)
AccountingGeneral.removePersonalFromBalance(ValyaPreHireEmployee)

console.log(AccountingGeneral);
console.log(AccountingGeneral.salaryBalance);
