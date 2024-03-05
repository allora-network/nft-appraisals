import { Console } from "as-wasi/assembly";
import { CgiCommand, cgiExtendsList } from "@blockless/sdk/assembly/cgi";
import { memory } from "@blockless/sdk/assembly";
import { buffer2string } from "@blockless/sdk/assembly/strings";
// env ALLORA_ARG_PARAMS=FOO BLS_LIST_VARS=ALLORA_ARG_PARAMS
let envVars = new memory.EnvVars().read().toJSON();
if (envVars) {
	let environmentValue = envVars.get("ALLORA_ARG_PARAMS");
	if (environmentValue) {
		// get as list of the extensions available
		let l = cgiExtendsList();

		if (l != null) {
			let command = new CgiCommand("cgi-allora-infer", null, null);
			let rs = command.exec();
			if (rs == true) {
				const SEP = "\r\n";
				let buf = new Array<u8>(1024);
				let req = `{"arguments":["${environmentValue.toString()}"]}`;
				let req_len = req.length;
				let head = `${req_len}${SEP}`;
				command.stdinWriteString(head);
				command.stdinWriteString(`${req}${SEP}`);
				buf = new Array<u8>(65535);
				let all_buff: u8[] = new Array(0);
				let l = command.stdoutRead(buf);
				all_buff = all_buff.concat(buf.slice(0, l));
				let read_string = buffer2string(all_buff, all_buff.length);
				Console.log(read_string);
			} else {
				Console.log(
					"error: no response from the inference extension, source: cgi-allora-infer",
				);
			}
			command.close();
		} else {
			Console.log(
				"error: inference extension not available, source: cgi-allora-infer",
			);
		}
	} else {
		Console.log(
			"error: inference param not available: ALLORA_ARG_PARAMS, source: cgi-allora-infer",
		);
	}
}