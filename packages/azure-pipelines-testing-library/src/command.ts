export interface Command {
  type: "task.debug" | "task.issue" | "task.complete";
  properties: Record<string, string>;
  message: string;
}

export function isCommand(line: string) {
  if (!line.startsWith("##vso")) {
    return false;
  }

  const lbPos = line.indexOf('[');
  const rbPos = line.indexOf(']');
  if (lbPos == -1 || rbPos == -1 || rbPos - lbPos < 3) {
      return false;
  }

  return true;
}

function parseCommand(line: string): Command {
  if (!isCommand(line)) {
    throw new Error("Not a command");
  }

  const lbPos = line.indexOf('[');
  const rbPos = line.indexOf(']');
  const commandInfo = line.substring(lbPos + 1, rbPos);
  const [type, commandProperties = ""] = commandInfo.split(' ');
  const message = unescapedata(line.substring(rbPos + 1));

  const properties: Record<string, string> = {};
  commandProperties
    .split(";")
    .filter(Boolean)
    .map(pair => pair.split('='))
    .forEach(([key, value]) => properties[key] = unescape(value));

  return {
    type: type as Command["type"],
    properties,
    message
  }
} 

export function parseCommands(text: string): Command[] {
  return text
    .replace(/\r\n/g, "\n")
    .split('\n')
    .filter(isCommand)
    .map(parseCommand);
}

function unescapedata(s: string) : string {
  return s.replace(/%0D/g, '\r')
          .replace(/%0A/g, '\n')
          .replace(/%AZP25/g, '%');
}

function unescape(s: string) : string {
  return s.replace(/%0D/g, '\r')
          .replace(/%0A/g, '\n')
          .replace(/%5D/g, ']')
          .replace(/%3B/g, ';')
          .replace(/%AZP25/g, '%');
}
