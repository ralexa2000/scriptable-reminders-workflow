const settings = {
    generalReminderList: "Общий",
    checkLists: {
        "Заказать в аптеке": {
            limitCount: 3,
            limitDate: 7,
        },
        "Заказать в озоне": {
            limitCount: 5,
            limitDate: 10,
        },
    },
}
const generalReminderList = await Calendar.forRemindersByTitle(settings.generalReminderList);


async function processReminderList(reminderListName, limitCount, limitDate) {
    const reminderList = await Calendar.forRemindersByTitle(reminderListName);
    const reminders = await Reminder.allIncomplete([reminderList]);
    const count = reminders.length;

    var oldestDate = new Date();
    for (const reminder of reminders) {
        if (!oldestDate || reminder.creationDate < oldestDate) {
            oldestDate = reminder.creationDate;
        }
    }

    const currentDate = new Date();
    const limitData = new Date();
    limitData.setDate(currentDate.getDate() - limitDate);
    console.log(`Found ${count} reminders in the list (limit ${limitCount})`);
    console.log(`Oldest reminder is at ${oldestDate} (limit ${limitDate})`);

    if (count >= limitCount || oldestDate < limitData) {
        let foundReminder = null;
        const allGeneralReminders = await Reminder.allIncomplete([generalReminderList]);
        for (const reminder of allGeneralReminders) {
            if (reminder.title == reminderListName && reminder.dueDate <= currentDate) {
                foundReminder = reminder;
                break;
            }
        }
        var dueDate = new Date();
        if (foundReminder) {
            console.log(`Found existing reminder, deleting`);
            dueDate = foundReminder.dueDate;
            foundReminder.remove();
        }

        let newReminder = new Reminder();
        newReminder.title = reminderListName;
        newReminder.calendar = generalReminderList;
        newReminder.dueDate = dueDate;
        newReminder.dueDateIncludesTime = false;
        newReminder.save();
        console.log(`Added reminder ${reminderListName}`);
    } else {
        console.log(`No limit reached, skipping`);
    }
}

for (let listName in settings.checkLists) {
    let listOptions = settings.checkLists[listName];
    console.log(`Processing reminders from list '${listName}'`);
    await processReminderList(listName, listOptions.limitCount, listOptions.limitDate);
}
console.log("Completed")
Script.complete();